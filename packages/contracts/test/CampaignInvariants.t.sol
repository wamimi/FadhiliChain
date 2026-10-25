// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Campaign} from "../contracts/Campaign.sol";
import {CampaignFactory} from "../contracts/CampaignFactory.sol";
import {MockStablecoin} from "../contracts/test/MockStablecoin.sol";

/// @notice Drives random sequences of contribute / time / cancel / withdraw / refund against one campaign.
contract CampaignHandler is Test {
    Campaign public campaign;
    MockStablecoin public token;
    address public recipient;
    address public organiser;
    address public canceller;

    address[] public donors;
    mapping(address => uint256) public ghostContributed;
    mapping(address => uint256) public ghostRefunded;
    uint256 public ghostWithdrawn;

    constructor(Campaign c, MockStablecoin t, address recipient_, address organiser_, address canceller_) {
        campaign = c;
        token = t;
        recipient = recipient_;
        organiser = organiser_;
        canceller = canceller_;
        for (uint256 i; i < 5; ++i) donors.push(address(uint160(0xD000 + i)));
    }

    function donorCount() external view returns (uint256) {
        return donors.length;
    }

    function contribute(uint256 who, uint256 amount) external {
        address d = donors[who % donors.length];
        amount = bound(amount, 1, 1e24);
        if (campaign.status() != Campaign.Status.Open) return;
        token.mint(d, amount);
        vm.startPrank(d);
        token.approve(address(campaign), amount);
        campaign.contribute(amount);
        vm.stopPrank();
        ghostContributed[d] += amount;
    }

    function passTime(uint256 secs) external {
        vm.warp(block.timestamp + bound(secs, 1, 10 days));
    }

    function cancel(bool asCanceller) external {
        if (campaign.cancelled() || campaign.withdrawn()) return;
        address who = asCanceller ? canceller : organiser;
        if (!asCanceller && block.timestamp >= campaign.deadline()) return;
        vm.prank(who);
        campaign.cancel();
    }

    function withdraw() external {
        if (campaign.status() != Campaign.Status.Successful) return;
        uint256 bal = token.balanceOf(address(campaign));
        vm.prank(recipient);
        campaign.withdraw();
        ghostWithdrawn += bal;
    }

    function refund(uint256 who) external {
        address d = donors[who % donors.length];
        Campaign.Status s = campaign.status();
        if (s != Campaign.Status.Failed && s != Campaign.Status.Cancelled) return;
        uint256 owed = campaign.contributionOf(d);
        if (owed == 0) return;
        vm.prank(d);
        campaign.claimRefund();
        ghostRefunded[d] += owed;
    }
}

contract CampaignInvariantTest is Test {
    CampaignHandler handler;
    Campaign campaign;
    MockStablecoin token;

    function setUp() public {
        vm.warp(1_750_000_000);
        address admin = makeAddr("admin");
        CampaignFactory factory = new CampaignFactory(admin, 1 days);
        token = new MockStablecoin("Test Kenyan Shilling", "KESm", 18);

        vm.startPrank(admin);
        factory.grantRole(factory.APPROVER_ROLE(), admin);
        factory.grantRole(factory.CANCELLER_ROLE(), admin);
        factory.setTokenAllowed(address(token), true);
        (address organiser, uint256 organiserKey) = makeAddrAndKey("organiser");
        CampaignFactory.CampaignRequest memory req = CampaignFactory.CampaignRequest({
            token: address(token),
            organiser: organiser,
            recipient: makeAddr("recipient"),
            target: 5e24,
            deadline: uint64(block.timestamp + 20 days),
            metadataHash: 0,
            nonce: 0,
            expiry: uint64(block.timestamp + 1 days)
        });
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(organiserKey, factory.hashRequest(req));
        campaign = Campaign(factory.createCampaign(req, abi.encodePacked(r, s, v)));
        vm.stopPrank();

        handler = new CampaignHandler(campaign, token, makeAddr("recipient"), organiser, admin);
        targetContract(address(handler));
    }

    /// Withdrawal and refunds never both happen.
    function invariant_withdrawalAndRefundsAreExclusive() public view {
        assertFalse(campaign.withdrawn() && campaign.totalRefunded() > 0);
    }

    /// Recorded contributions still owed are always fully backed by the contract's balance.
    function invariant_outstandingContributionsAreBacked() public view {
        if (campaign.withdrawn()) return;
        assertGe(token.balanceOf(address(campaign)), campaign.totalRaised() - campaign.totalRefunded());
    }

    /// Per-donor accounting matches what each donor paid in and took out.
    function invariant_perDonorAccounting() public view {
        uint256 sumOutstanding;
        for (uint256 i; i < handler.donorCount(); ++i) {
            address d = handler.donors(i);
            assertEq(campaign.contributionOf(d), handler.ghostContributed(d) - handler.ghostRefunded(d));
            assertLe(handler.ghostRefunded(d), handler.ghostContributed(d));
            sumOutstanding += campaign.contributionOf(d);
        }
        assertEq(sumOutstanding, campaign.totalRaised() - campaign.totalRefunded());
    }

    /// Money in equals money held plus money paid out.
    function invariant_conservation() public view {
        uint256 refunded = campaign.totalRefunded();
        assertEq(token.balanceOf(address(campaign)) + refunded + handler.ghostWithdrawn(), campaign.totalRaised());
    }
}
