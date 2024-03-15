// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "script/DeployTestnetToTest.s.sol";
import "test/setup/Constants.t.sol";

contract TractionTestnet is Script, WithFileHelpers {
    function traction() public {
        IBetRegistry betRegistry = IBetRegistry(_getAddress("betRegistry"));
        DegenToken degenToken = DegenToken(_getAddress("degenToken"));
        MockPriceFeed priceFeed = MockPriceFeed(_getAddress("priceFeed"));

        // Create a market
        vm.startBroadcast(vm.envUint("DEPLOYER_PK"));
        betRegistry.createMarket(uint40(block.timestamp + 120), DEGEN_PRICE_1 - 1);
        vm.stopBroadcast();

        // Place bets
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

        vm.startBroadcast(vm.envUint("CAROL_PK"));
        degenToken.mint(amount);
        degenToken.approve(address(betRegistry), amount);
        betRegistry.placeBet(0, amount, IBetRegistry.BetDirection.HIGHER);
        vm.stopBroadcast();

        // Resolve the market
        vm.warp(block.timestamp + 180);
        // HIGHER wins
        priceFeed.setPrice(DEGEN_PRICE_1);
        betRegistry.resolveMarket(0);

        // Cash out Alice
        // (Bob lost his bet)
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        betRegistry.cashOut(0);
        vm.stopBroadcast();

        // Simulate slash
        vm.warp(block.timestamp + 5 weeks);
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        betRegistry.slash(0);
        vm.stopBroadcast();

        // Create two new markets with different end times
        // 1 will stay open, 2 will close earlier
        vm.startBroadcast(vm.envUint("DEPLOYER_PK"));
        betRegistry.createMarket(uint40(block.timestamp + 1 days), DEGEN_PRICE_1 - 1);
        betRegistry.createMarket(uint40(block.timestamp + 120), DEGEN_PRICE_1 + 1);
        vm.stopBroadcast();

        // Place bets
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        degenToken.mint(amount * 2);
        degenToken.approve(address(betRegistry), amount * 2);
        betRegistry.placeBet(1, amount, IBetRegistry.BetDirection.HIGHER);
        betRegistry.placeBet(2, amount, IBetRegistry.BetDirection.LOWER);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("BOB_PK"));
        degenToken.mint(amount * 2);
        degenToken.approve(address(betRegistry), amount * 2);
        betRegistry.placeBet(1, amount, IBetRegistry.BetDirection.LOWER);
        betRegistry.placeBet(2, amount, IBetRegistry.BetDirection.HIGHER);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("CAROL_PK"));
        degenToken.mint(amount * 2);
        degenToken.approve(address(betRegistry), amount * 2);
        betRegistry.placeBet(1, amount, IBetRegistry.BetDirection.HIGHER);
        betRegistry.placeBet(2, amount, IBetRegistry.BetDirection.LOWER);
        vm.stopBroadcast();

        // Resolve 2, Alice and Carol win (HIGHER)
        vm.warp(block.timestamp + 180);
        betRegistry.resolveMarket(2);

        // Cash out
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        betRegistry.cashOut(2);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("CAROL_PK"));
        betRegistry.cashOut(2);
        vm.stopBroadcast();
    }

    function test_script() public {}
}
