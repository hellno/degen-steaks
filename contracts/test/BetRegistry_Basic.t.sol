// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithUtility} from "test/setup/WithUtility.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";

contract BetRegistry_Basic_Test is Test, WithUtility {
    function setUp() public {
        deploy();
    }

    function testCreateMarket() public {
        _createMarket(1 days, 1000);
        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.creator, address(this));
        assertEq(market.endTime, 1 days);
        assertEq(market.targetPrice, 1000);
        assertEq(market.totalHigher, 0);
        assertEq(market.totalLower, 0);
    }

    function test_placeBet_higher() public {
        _createMarket(1 days, 1000);
        _placeBet(0, 100, 0);

        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.totalHigher, 100);
        assertEq(market.totalLower, 0);

        IBetRegistry.Bet memory bet = _getBet(0, address(this));
        assertEq(bet.amountHigher, 100);
        assertEq(bet.amountLower, 0);
    }

    function test_placeBet_lower() public {
        _createMarket(1 days, 1000);
        _placeBet(0, 0, 100);
        IBetRegistry.Market memory market = _getMarket(0);

        assertEq(market.totalHigher, 0);
        assertEq(market.totalLower, 100);

        IBetRegistry.Bet memory bet = _getBet(0, address(this));
        assertEq(bet.amountHigher, 0);
        assertEq(bet.amountLower, 100);
    }

    function test_placeBet_multiple() public {
        _createMarket(1 days, 1000);

        _placeBet(0, 100, 100);
        _placeBet(0, 100, 0);
        _placeBet(0, 0, 100);

        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.totalHigher, 200, "totalHigher");
        assertEq(market.totalLower, 200, "totalLower");

        IBetRegistry.Bet memory bet = _getBet(0, address(this));
        assertEq(bet.amountHigher, 200, "amountHigher");
        assertEq(bet.amountLower, 200, "amountLower");
    }
}
