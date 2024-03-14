// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "script/DeployTestnetToTest.s.sol";

contract TractionTestnet is Script, WithFileHelpers {
    function traction() public {
        IBetRegistry betRegistry = IBetRegistry(_getAddress("betRegistry"));
        DegenToken degenToken = DegenToken(_getAddress("degenToken"));
        ISteakedDegen steakedDegen = ISteakedDegen(_getAddress("steakedDegen"));
        MockPriceFeed priceFeed = MockPriceFeed(_getAddress("priceFeed"));

        vm.startBroadcast(vm.envUint("DEPLOYER_PK"));
        betRegistry.createMarket(uint40(block.timestamp + 120), 3_468_565_538);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("ALICE_PK"));
        uint256 amount = 1e6 * 1e18;
        degenToken.mint(amount);
        degenToken.approve(address(betRegistry), amount);
        betRegistry.placeBet(0, amount, IBetRegistry.BetDirection.HIGHER);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("BOB_PK"));
        degenToken.mint(amount);
        degenToken.approve(address(betRegistry), amount);
        betRegistry.placeBet(0, amount, IBetRegistry.BetDirection.LOWER);
        vm.stopBroadcast();
    }
}
