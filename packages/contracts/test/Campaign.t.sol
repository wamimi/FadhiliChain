// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Campaign} from "../contracts/Campaign.sol";
import {CampaignFactory} from "../contracts/CampaignFactory.sol";
import {MockStablecoin} from "../contracts/test/MockStablecoin.sol";
import {FeeOnTransferToken, ReentrantToken, BlocklistToken} from "../contracts/test/HostileTokens.sol";

/// Test IDs (TC-xx) match the test case table in the project report.
contract CampaignTest is Test {
    CampaignFactory factory;
    MockStablecoin kes; // 18 decimals, like KESm
    MockStablecoin usdc; // 6 decimals, like USDC

    address admin = makeAddr("admin");
    address organiser;
    uint256 organiserKey;
    address recipient = makeAddr("recipient");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address mallory = makeAddr("mallory");

    uint256 constant TARGET = 50_000 ether; // KSh 50,000 in 18-decimal units
    uint64 deadline;

    function setUp() public {
        vm.warp(1_750_000_000);
        (organiser, organiserKey) = makeAddrAndKey("organiser");
        factory = new CampaignFactory(admin, 1 days);
        kes = new MockStablecoin("Test Kenyan Shilling", "KESm", 18);
        usdc = new MockStablecoin("Test USD Coin", "USDC", 6);

        vm.startPrank(admin);
        factory.grantRole(factory.APPROVER_ROLE(), admin);
        factory.grantRole(factory.CANCELLER_ROLE(), admin);
        factory.setTokenAllowed(address(kes), true);
        factory.setTokenAllowed(address(usdc), true);
        vm.stopPrank();

        deadline = uint64(block.timestamp + 30 days);
    }

    // ---------------------------------------------------------------- helpers

    function _request(address token, uint256 target, uint64 deadline_)
        internal
        view
        returns (CampaignFactory.CampaignRequest memory req)
    {
        req = CampaignFactory.CampaignRequest({
            token: token,
            organiser: organiser,
            recipient: recipient,
            target: target,
            deadline: deadline_,
            metadataHash: keccak256("story"),
            nonce: factory.nonces(organiser),
            expiry: uint64(block.timestamp + 7 days)
        });
    }

    function _sign(CampaignFactory.CampaignRequest memory req, uint256 key) internal view returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, factory.hashRequest(req));
        return abi.encodePacked(r, s, v);
    }

    function _submit(CampaignFactory.CampaignRequest memory req) internal returns (Campaign) {
        bytes memory sig = _sign(req, organiserKey);
        vm.prank(admin);
        return Campaign(factory.createCampaign(req, sig));
    }

    function _create(address token, uint256 target) internal returns (Campaign c) {
        c = _submit(_request(token, target, deadline));
    }

    function _give(Campaign c, address donor, uint256 amount) internal {
        MockStablecoin t = MockStablecoin(address(c.token()));
        t.mint(donor, amount);
        vm.startPrank(donor);
        t.approve(address(c), amount);
        c.contribute(amount);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------- factory

    function test_TC01_factorySetsRolesAndImplementation() public view {
        assertTrue(factory.hasRole(factory.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(factory.implementation() != address(0));
        assertEq(factory.campaignCount(), 0);
    }

    function test_TC02_onlyApproverCanCreate() public {
        CampaignFactory.CampaignRequest memory req = _request(address(kes), TARGET, deadline);
        bytes memory sig = _sign(req, organiserKey);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, mallory, factory.APPROVER_ROLE()
            )
        );
        vm.prank(mallory);
        factory.createCampaign(req, sig);
    }

    function test_TC03_rejectsTokenNotOnList() public {
        MockStablecoin other = new MockStablecoin("Other", "OTH", 18);
        CampaignFactory.CampaignRequest memory req = _request(address(other), TARGET, deadline);
        bytes memory sig = _sign(req, organiserKey);
        vm.expectRevert(abi.encodeWithSelector(CampaignFactory.TokenNotAllowed.selector, address(other)));
        vm.prank(admin);
        factory.createCampaign(req, sig);
    }

    function test_TC04_rejectsDurationOutOfRange() public {
        CampaignFactory.CampaignRequest memory tooShort = _request(address(kes), TARGET, uint64(block.timestamp + 10 minutes));
        CampaignFactory.CampaignRequest memory tooLong = _request(address(kes), TARGET, uint64(block.timestamp + 400 days));
        bytes memory sigShort = _sign(tooShort, organiserKey);
        bytes memory sigLong = _sign(tooLong, organiserKey);
        vm.startPrank(admin);
        vm.expectRevert(CampaignFactory.InvalidDuration.selector);
        factory.createCampaign(tooShort, sigShort);
        vm.expectRevert(CampaignFactory.InvalidDuration.selector);
        factory.createCampaign(tooLong, sigLong);
        vm.stopPrank();
    }

    function test_TC05_rejectsZeroTargetAndZeroAddresses() public {
        CampaignFactory.CampaignRequest memory zeroTarget = _request(address(kes), 0, deadline);
        bytes memory sig1 = _sign(zeroTarget, organiserKey);
        vm.expectRevert(Campaign.InvalidTarget.selector);
        vm.prank(admin);
        factory.createCampaign(zeroTarget, sig1);

        CampaignFactory.CampaignRequest memory zeroRecipient = _request(address(kes), TARGET, deadline);
        zeroRecipient.recipient = address(0);
        bytes memory sig2 = _sign(zeroRecipient, organiserKey);
        vm.expectRevert(Campaign.ZeroAddress.selector);
        vm.prank(admin);
        factory.createCampaign(zeroRecipient, sig2);
    }

    function test_TC06_implementationAndClonesCannotBeReinitialised() public {
        Campaign impl = Campaign(factory.implementation());
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        impl.initialize(IERC20(address(kes)), mallory, mallory, 1, deadline, 0);

        Campaign c = _create(address(kes), TARGET);
        vm.expectRevert(Initializable.InvalidInitialization.selector);
        c.initialize(IERC20(address(kes)), mallory, mallory, 1, deadline, 0);
    }

    function test_TC07_listsCampaignsWithPagination() public {
        Campaign a = _create(address(kes), TARGET);
        Campaign b = _create(address(usdc), 100e6);
        assertEq(factory.campaignCount(), 2);
        address[] memory page = factory.campaigns(1, 10);
        assertEq(page.length, 1);
        assertEq(page[0], address(b));
        assertTrue(factory.isCampaign(address(a)));
        assertEq(factory.campaigns(5, 10).length, 0);
    }

    function test_TC08_removingTokenDoesNotAffectExistingCampaign() public {
        Campaign c = _create(address(kes), TARGET);
        vm.prank(admin);
        factory.setTokenAllowed(address(kes), false);
        _give(c, alice, 10 ether);
        assertEq(c.totalRaised(), 10 ether);
    }

    // ---------------------------------------------------------------- contributions

    function test_TC09_contributionIsRecordedAndEmitted() public {
        Campaign c = _create(address(kes), TARGET);
        kes.mint(alice, 1_500 ether);
        vm.startPrank(alice);
        kes.approve(address(c), 1_500 ether);
        vm.expectEmit(address(c));
        emit Campaign.Contributed(alice, 1_500 ether, 1_500 ether);
        c.contribute(1_500 ether);
        vm.stopPrank();

        assertEq(c.contributionOf(alice), 1_500 ether);
        assertEq(c.totalRaised(), 1_500 ether);
        assertEq(kes.balanceOf(address(c)), 1_500 ether);
    }

    function test_TC10_zeroContributionReverts() public {
        Campaign c = _create(address(kes), TARGET);
        vm.expectRevert(Campaign.ZeroAmount.selector);
        vm.prank(alice);
        c.contribute(0);
    }

    function test_TC11_deadlineBoundary() public {
        Campaign c = _create(address(kes), TARGET);
        vm.warp(deadline - 1);
        _give(c, alice, 1 ether); // last second is still open

        vm.warp(deadline);
        kes.mint(bob, 1 ether);
        vm.startPrank(bob);
        kes.approve(address(c), 1 ether);
        vm.expectRevert(Campaign.NotOpen.selector);
        c.contribute(1 ether);
        vm.stopPrank();
    }

    function test_TC12_feeOnTransferTokenIsRejected() public {
        FeeOnTransferToken fee = new FeeOnTransferToken();
        vm.prank(admin);
        factory.setTokenAllowed(address(fee), true);
        Campaign c = _create(address(fee), TARGET);

        fee.mint(alice, 100 ether);
        vm.startPrank(alice);
        fee.approve(address(c), 100 ether);
        vm.expectRevert(abi.encodeWithSelector(Campaign.TransferAmountMismatch.selector, 100 ether, 99 ether));
        c.contribute(100 ether);
        vm.stopPrank();
    }

    function test_TC13_sixDecimalTokenTargetIsExact() public {
        Campaign c = _create(address(usdc), 100e6); // USD 100.000000
        Campaign d = _create(address(usdc), 100e6);
        _give(c, alice, 99_999_999); // one micro-dollar short
        _give(d, bob, 100e6);
        vm.warp(deadline);
        assertEq(uint8(c.status()), uint8(Campaign.Status.Failed));
        assertEq(uint8(d.status()), uint8(Campaign.Status.Successful));
    }

    // ---------------------------------------------------------------- withdrawal

    function test_TC14_cannotWithdrawBeforeDeadline() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET);
        vm.expectRevert(Campaign.NotSuccessful.selector);
        vm.prank(recipient);
        c.withdraw();
    }

    function test_TC15_recipientWithdrawsOnceAfterSuccess() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, 30_000 ether);
        _give(c, bob, 25_000 ether);
        vm.warp(deadline);

        vm.prank(recipient);
        c.withdraw();
        assertEq(kes.balanceOf(recipient), 55_000 ether);
        assertEq(uint8(c.status()), uint8(Campaign.Status.Withdrawn));

        vm.expectRevert(Campaign.NotSuccessful.selector);
        vm.prank(recipient);
        c.withdraw();
    }

    function test_TC16_onlyRecipientCanWithdraw() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET);
        vm.warp(deadline);
        address[3] memory others = [admin, organiser, mallory];
        for (uint256 i; i < others.length; ++i) {
            vm.expectRevert(Campaign.NotAuthorised.selector);
            vm.prank(others[i]);
            c.withdraw();
        }
    }

    function test_TC17_cannotWithdrawWhenTargetMissed() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET - 1);
        vm.warp(deadline);
        vm.expectRevert(Campaign.NotSuccessful.selector);
        vm.prank(recipient);
        c.withdraw();
    }

    function test_TC18_withdrawToWorksWhenRecipientIsBlocked() public {
        BlocklistToken blk = new BlocklistToken();
        vm.prank(admin);
        factory.setTokenAllowed(address(blk), true);
        Campaign c = _create(address(blk), 10 ether);

        blk.mint(alice, 10 ether);
        vm.startPrank(alice);
        blk.approve(address(c), 10 ether);
        c.contribute(10 ether);
        vm.stopPrank();

        vm.warp(deadline);
        blk.setBlocked(recipient, true);

        vm.expectRevert(abi.encodeWithSelector(BlocklistToken.Blocked.selector, recipient));
        vm.prank(recipient);
        c.withdraw();

        address backup = makeAddr("backup");
        vm.prank(recipient);
        c.withdrawTo(backup);
        assertEq(blk.balanceOf(backup), 10 ether);
    }

    // ---------------------------------------------------------------- refunds

    function test_TC19_refundAfterFailure() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, 1_000 ether);
        _give(c, bob, 2_000 ether);
        vm.warp(deadline);

        assertEq(c.refundableOf(alice), 1_000 ether);
        vm.prank(alice);
        c.claimRefund();
        assertEq(kes.balanceOf(alice), 1_000 ether);
        assertEq(c.contributionOf(alice), 0);

        vm.expectRevert(Campaign.NothingToRefund.selector);
        vm.prank(alice);
        c.claimRefund();

        vm.prank(bob);
        c.claimRefund();
        assertEq(kes.balanceOf(address(c)), 0);
        assertEq(c.totalRefunded(), 3_000 ether);
    }

    function test_TC20_noRefundWhileOpenOrAfterSuccess() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET);

        vm.expectRevert(Campaign.RefundsNotOpen.selector);
        vm.prank(alice);
        c.claimRefund();

        vm.warp(deadline);
        vm.expectRevert(Campaign.RefundsNotOpen.selector);
        vm.prank(alice);
        c.claimRefund();
        assertEq(c.refundableOf(alice), 0);
    }

    function test_TC21_nonDonorHasNothingToRefund() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, 1 ether);
        vm.warp(deadline);
        vm.expectRevert(Campaign.NothingToRefund.selector);
        vm.prank(mallory);
        c.claimRefund();
    }

    // ---------------------------------------------------------------- cancellation

    function test_TC22_organiserCancelOpensRefundsAndBlocksWithdraw() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET);

        vm.prank(organiser);
        c.cancel();
        assertEq(uint8(c.status()), uint8(Campaign.Status.Cancelled));

        vm.expectRevert(Campaign.NotOpen.selector);
        vm.prank(bob);
        c.contribute(1);

        vm.warp(deadline);
        vm.expectRevert(Campaign.NotSuccessful.selector);
        vm.prank(recipient);
        c.withdraw();

        vm.prank(alice);
        c.claimRefund();
        assertEq(kes.balanceOf(alice), TARGET);
    }

    function test_TC23_organiserCannotCancelAfterDeadlineButCancellerCan() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET);
        vm.warp(deadline);

        vm.expectRevert(Campaign.NotOpen.selector);
        vm.prank(organiser);
        c.cancel();

        vm.prank(admin); // holds CANCELLER_ROLE
        c.cancel();
        assertEq(c.refundableOf(alice), TARGET);
    }

    function test_TC24_nobodyCanCancelAfterWithdrawal() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET);
        vm.warp(deadline);
        vm.prank(recipient);
        c.withdraw();

        vm.expectRevert(Campaign.AlreadyFinalised.selector);
        vm.prank(admin);
        c.cancel();
    }

    function test_TC25_strangersCannotCancel() public {
        Campaign c = _create(address(kes), TARGET);
        vm.expectRevert(Campaign.NotAuthorised.selector);
        vm.prank(mallory);
        c.cancel();
    }

    function test_TC26_adminHasNoPathToFunds() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, TARGET);
        vm.warp(deadline);

        vm.startPrank(admin);
        vm.expectRevert(Campaign.NotAuthorised.selector);
        c.withdraw();
        vm.expectRevert(Campaign.NotAuthorised.selector);
        c.withdrawTo(admin);
        c.cancel(); // allowed, but it only opens refunds
        vm.expectRevert(Campaign.NothingToRefund.selector);
        c.claimRefund();
        vm.stopPrank();

        assertEq(kes.balanceOf(admin), 0);
        assertEq(kes.balanceOf(address(c)), TARGET);
    }

    // ---------------------------------------------------------------- hostile tokens

    function test_TC27_reentrancyDuringRefundIsBlocked() public {
        ReentrantToken ree = new ReentrantToken();
        vm.prank(admin);
        factory.setTokenAllowed(address(ree), true);
        Campaign c = _create(address(ree), TARGET);

        ree.mint(alice, 10 ether);
        vm.startPrank(alice);
        ree.approve(address(c), 10 ether);
        c.contribute(10 ether);
        vm.stopPrank();
        vm.warp(deadline);

        ree.arm(address(c), abi.encodeCall(Campaign.claimRefund, ()));
        vm.prank(alice);
        c.claimRefund();

        assertFalse(ree.reentered());
        assertEq(bytes4(ree.revertData()), ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        assertEq(ree.balanceOf(alice), 10 ether);
        assertEq(c.totalRefunded(), 10 ether);
    }

    function test_TC28_strayTransfersAreNotRefundable() public {
        Campaign c = _create(address(kes), TARGET);
        _give(c, alice, 5 ether);
        kes.mint(mallory, 7 ether);
        vm.prank(mallory);
        kes.transfer(address(c), 7 ether); // bypasses contribute()

        assertEq(c.totalRaised(), 5 ether);
        vm.warp(deadline);
        vm.expectRevert(Campaign.NothingToRefund.selector);
        vm.prank(mallory);
        c.claimRefund();

        vm.prank(alice);
        c.claimRefund();
        assertEq(kes.balanceOf(alice), 5 ether);
    }

    // ---------------------------------------------------------------- organiser signature

    function test_TC29_approverCannotChangeSignedTerms() public {
        CampaignFactory.CampaignRequest memory req = _request(address(kes), TARGET, deadline);
        bytes memory sig = _sign(req, organiserKey);

        req.recipient = admin; // approver tries to redirect the money
        vm.expectRevert(CampaignFactory.InvalidOrganiserSignature.selector);
        vm.prank(admin);
        factory.createCampaign(req, sig);

        req.recipient = recipient;
        req.target = 1; // or lower the target
        vm.expectRevert(CampaignFactory.InvalidOrganiserSignature.selector);
        vm.prank(admin);
        factory.createCampaign(req, sig);
    }

    function test_TC30_signedRequestCannotBeReplayed() public {
        CampaignFactory.CampaignRequest memory req = _request(address(kes), TARGET, deadline);
        bytes memory sig = _sign(req, organiserKey);
        vm.startPrank(admin);
        factory.createCampaign(req, sig);
        vm.expectRevert(abi.encodeWithSelector(CampaignFactory.InvalidNonce.selector, 1, 0));
        factory.createCampaign(req, sig);
        vm.stopPrank();
        assertEq(factory.campaignCount(), 1);
    }

    function test_TC31_expiredRequestIsRejected() public {
        CampaignFactory.CampaignRequest memory req = _request(address(kes), TARGET, deadline);
        bytes memory sig = _sign(req, organiserKey);
        vm.warp(req.expiry + 1);
        vm.expectRevert(CampaignFactory.RequestExpired.selector);
        vm.prank(admin);
        factory.createCampaign(req, sig);
    }

    function test_TC32_signatureFromSomeoneElseIsRejected() public {
        (, uint256 malloryKey) = makeAddrAndKey("mallory-signer");
        CampaignFactory.CampaignRequest memory req = _request(address(kes), TARGET, deadline);
        bytes memory sig = _sign(req, malloryKey);
        vm.expectRevert(CampaignFactory.InvalidOrganiserSignature.selector);
        vm.prank(admin);
        factory.createCampaign(req, sig);
    }

    // ---------------------------------------------------------------- fuzz

    function testFuzz_contributionsAddUpAndRefundInFull(uint96[8] memory amounts, uint256 targetSeed) public {
        uint256 target = bound(targetSeed, 1, type(uint96).max);
        Campaign c = _create(address(kes), target);

        uint256 sum;
        for (uint256 i; i < amounts.length; ++i) {
            if (amounts[i] == 0) continue;
            address donor = address(uint160(0x1000 + i));
            _give(c, donor, amounts[i]);
            sum += amounts[i];
        }
        assertEq(c.totalRaised(), sum);
        assertEq(kes.balanceOf(address(c)), sum);

        vm.warp(deadline);
        if (sum >= target) {
            vm.prank(recipient);
            c.withdraw();
            assertEq(kes.balanceOf(recipient), sum);
        } else {
            for (uint256 i; i < amounts.length; ++i) {
                if (amounts[i] == 0) continue;
                address donor = address(uint160(0x1000 + i));
                vm.prank(donor);
                c.claimRefund();
                assertEq(kes.balanceOf(donor), amounts[i]);
            }
            assertEq(kes.balanceOf(address(c)), 0);
        }
    }
}
