// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {CampaignFactory} from "../contracts/CampaignFactory.sol";
import {MockStablecoin} from "../contracts/test/MockStablecoin.sol";

/// @notice Deploys CampaignFactory, grants the reviewer roles, sets the platform fee and allows the network's stablecoins.
///
/// Optional environment variables (defaults in brackets):
///   APPROVER              account allowed to create reviewed campaigns [deployer]
///   CANCELLER             account allowed to cancel campaigns before payout [deployer]
///   TREASURY              account that receives the platform fee [deployer]
///   FEE_BPS               platform fee in basis points, at most 500 [200 = 2%]
///   ADMIN_TRANSFER_DELAY  seconds before a new default admin can take over [86400]
///   DEPLOY_TEST_KES       on Celo Sepolia, also deploy and allow a labelled test Kenyan shilling with an open mint [false].
///                         Mento's KESm has no usable test-network liquidity, so this stands in for it in demos.
///
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url celo_sepolia --account deployerfadhilichain --sender <deployer address> --broadcast
contract Deploy is Script {
    // Mento stablecoins on Celo Sepolia (docs.celo.org, "Stablecoin contracts").
    address constant KESM_CELO_SEPOLIA = 0xC7e4635651E3e3Af82b61d3E23c159438daE3BbF;
    address constant USDM_CELO_SEPOLIA = 0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b;
    // Circle test USDC (developers.circle.com, "USDC contract addresses").
    address constant USDC_CELO_SEPOLIA = 0x01C5C0122039549AD1493B8220cABEdD739BC44E;
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    uint256 constant CELO_SEPOLIA = 11142220;
    uint256 constant BASE_SEPOLIA = 84532;
    uint256 constant LOCAL = 31337;

    /// Foundry's placeholder sender, used when no account is passed. Deploying with it would make an unusable admin.
    address constant FOUNDRY_DEFAULT_SENDER = 0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38;

    function run() external returns (CampaignFactory factory) {
        address deployer = msg.sender;
        require(deployer != FOUNDRY_DEFAULT_SENDER, "Deploy: pass --account and --sender");
        address approver = vm.envOr("APPROVER", deployer);
        address canceller = vm.envOr("CANCELLER", deployer);
        address treasury = vm.envOr("TREASURY", deployer);
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(200)));
        uint48 delay = uint48(vm.envOr("ADMIN_TRANSFER_DELAY", uint256(1 days)));
        uint256 startBlock = block.number;

        vm.startBroadcast();

        factory = new CampaignFactory(deployer, delay);

        // On a local chain, deploy mock currencies right after the factory so their addresses are predictable.
        address[] memory tokens = _tokens();

        factory.grantRole(factory.APPROVER_ROLE(), approver);
        factory.grantRole(factory.CANCELLER_ROLE(), canceller);
        factory.setFee(feeBps, treasury);
        for (uint256 i; i < tokens.length; ++i) {
            factory.setTokenAllowed(tokens[i], true);
        }

        vm.stopBroadcast();

        console.log("CampaignFactory", address(factory));
        console.log("Campaign implementation", factory.implementation());
        console.log("Start block", startBlock);

        string memory key = "deployment";
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeUint(key, "startBlock", startBlock);
        vm.serializeAddress(key, "implementation", factory.implementation());
        vm.serializeAddress(key, "tokens", tokens);
        if (block.chainid == CELO_SEPOLIA && tokens.length == 4) vm.serializeAddress(key, "testKes", tokens[3]);
        string memory json = vm.serializeAddress(key, "campaignFactory", address(factory));
        vm.writeJson(json, string.concat("deployments/", vm.toString(block.chainid), ".json"));
    }

    function _tokens() private returns (address[] memory tokens) {
        if (block.chainid == CELO_SEPOLIA) {
            bool testKes = vm.envOr("DEPLOY_TEST_KES", false);
            tokens = new address[](testKes ? 4 : 3);
            tokens[0] = KESM_CELO_SEPOLIA;
            tokens[1] = USDM_CELO_SEPOLIA;
            tokens[2] = USDC_CELO_SEPOLIA;
            if (testKes) tokens[3] = address(new MockStablecoin("Test Kenyan Shilling", "tKES", 18));
        } else if (block.chainid == BASE_SEPOLIA) {
            tokens = new address[](1);
            tokens[0] = USDC_BASE_SEPOLIA;
        } else if (block.chainid == LOCAL) {
            tokens = new address[](2);
            tokens[0] = address(new MockStablecoin("Mock Kenyan Shilling", "KESm", 18));
            tokens[1] = address(new MockStablecoin("Mock USD Coin", "USDC", 6));
        } else {
            revert("Deploy: unsupported network");
        }
    }
}
