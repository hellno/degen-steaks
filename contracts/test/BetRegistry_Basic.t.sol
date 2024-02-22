// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {IBetRegistry, BetRegistry} from "../src/BetRegistry.sol";

contract BetRegistry_Basic_Test is Test {
    BetRegistry betRegistry;

    function setUp() public {
        betRegistry = new BetRegistry();
    }

    function testCreateMarket() public {
        betRegistry.createMarket(100, 1000);
        IBetRegistry.Market memory market = betRegistry.getMarket(0);
        assertEq(market.creator, address(this));
        assertEq(market.endTime, 100);
        assertEq(market.targetPrice, 1000);
        assertEq(market.totalHigher, 0);
        assertEq(market.totalLower, 0);
    }
}
