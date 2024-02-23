// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithUtility} from "test/setup/WithUtility.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import "test/setup/Constants.t.sol";

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
        assertEq(market.totalSteakedDegen, 0);
    }

    function test_getMarket_fail_outOfRange() public {
        vm.expectRevert("BetRegistry::getMarket: marketId out of range.");
        _getMarket(1);
    }

    function test_placeBet_higher() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);

        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.totalHigher, SDEGENS_SECOND_DEPOSIT, "totalHigher");
        assertEq(market.totalLower, 0, "totalLower");

        IBetRegistry.Bet memory bet = _getBet(0, address(this));
        assertEq(bet.amountHigher, SDEGENS_SECOND_DEPOSIT, "amountHigher");
        assertEq(bet.amountLower, 0, "amountLower");
    }

    function test_placeBet_lower() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        IBetRegistry.Market memory market = _getMarket(0);

        assertEq(market.totalHigher, 0);
        assertEq(market.totalLower, SDEGENS_SECOND_DEPOSIT);
        assertEq(market.totalSteakedDegen, SDEGENS_SECOND_DEPOSIT, "totalSteakedDegen");

        IBetRegistry.Bet memory bet = _getBet(0, address(this));
        assertEq(bet.amountHigher, 0);
        assertEq(bet.amountLower, SDEGENS_SECOND_DEPOSIT);
    }

    function test_placeBet_lower_twice() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        IBetRegistry.Market memory market = _getMarket(0);

        assertEq(market.totalSteakedDegen, SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT, "totalSteakedDegen");
    }

    function test_placeBet_multiple() public {
        _createMarket(1 days, 1000);

        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);

        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.totalHigher / 1e18, 193, "totalHigher");
        assertEq(market.totalLower / 1e18, 191, "totalLower");
        assertEq(
            market.totalSteakedDegen,
            SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT + SDEGENS_FOURTH_DEPOSIT + SDEGENS_FIFTH_DEPOSIT,
            "totalSteakedDegen"
        );

        IBetRegistry.Bet memory bet = _getBet(0, address(this));
        assertEq(bet.amountHigher / 1e18, 193, "amountHigher");
        assertEq(bet.amountLower / 1e18, 191, "amountLower");
    }

    function test_placeBet_fail_outOfRange() public {
        _dealAndApprove(address(this), 200);
        vm.expectRevert("BetRegistry::placeBet: marketId out of range.");
        betRegistry.placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
    }

    function test_placeBet_fail_marketEnded() public {
        _createMarket(1 days, 1000);
        vm.warp(2 days);
        _dealAndApprove(address(this), 200);
        vm.expectRevert("BetRegistry::placeBet: market has ended.");
        betRegistry.placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
    }

    function test_resolveBet_fail_notEnded() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);

        vm.expectRevert("BetRegistry::resolveMarket: market has not ended.");
        betRegistry.resolveMarket(0);
    }
}
