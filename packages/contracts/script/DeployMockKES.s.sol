// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {CampaignFactory} from "../contracts/CampaignFactory.sol";
import {MockStablecoin} from "../contracts/test/MockStablecoin.sol";

/// @notice Fallback for test networks only: deploys a clearly labelled mock Kenyan shilling and allows it on the factory.
/// Use only if test KESm cannot be obtained.
///
///   FACTORY=0x... forge script script/DeployMockKES.s.sol --rpc-url celo_sepolia --account deployerfadhilichain --broadcast
contract DeployMockKES is Script {
    function run() external returns (MockStablecoin token) {
        require(block.chainid != 42220 && block.chainid != 8453, "DeployMockKES: test networks only");
        CampaignFactory factory = CampaignFactory(vm.envAddress("FACTORY"));
        vm.startBroadcast();
        token = new MockStablecoin("Mock Kenyan Shilling (test only)", "mKES", 18);
        factory.setTokenAllowed(address(token), true);
        vm.stopBroadcast();
        console.log("Mock KES", address(token));
    }
}
