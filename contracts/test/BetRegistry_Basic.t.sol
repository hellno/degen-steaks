// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithTestHelpers} from "test/setup/WithTestHelpers.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import "test/setup/Constants.t.sol";

contract BetRegistry_Basic_Test is Test, WithTestHelpers {
    function setUp() public {
        deploy();
    }

    function test_CreateMarket_basic() public {
        _createMarket(1 days, 1000);
        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.creator, address(this));
        assertEq(market.endTime, 1 days);
        assertEq(market.targetPrice, 1000);
        assertEq(market.endPrice, 0);
        assertEq(market.totalHigher, 0);
        assertEq(market.totalLower, 0);
        assertEq(market.totalSteakedDegen, 0);
        assertEq(market.totalDegen, 0);
    }

    function test_createMarket_fail_onlyFan() public {
        vm.prank(ALICE);
        vm.expectRevert("BetRegistry::onlyFans: caller is not a fan.");
        betRegistry.createMarket(1 days, 1000);
    }

    function test_createMarket_afterSetFan() public {
        betRegistry.setFan(ALICE, true);
        _createMarket(1 days, 1000);
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

        IBetRegistry.Bet memory bet = _getBet(0, ALICE);
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

        IBetRegistry.Bet memory bet = _getBet(0, ALICE);
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

        IBetRegistry.Bet memory bet = _getBet(0, ALICE);
        assertEq(bet.amountHigher / 1e18, 193, "amountHigher");
        assertEq(bet.amountLower / 1e18, 191, "amountLower");
    }

    function test_placeBet_fail_outOfRange() public {
        _dealAndApprove(address(this), 200);
        vm.expectRevert("BetRegistry::placeBet: marketId out of range.");
        betRegistry.placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
    }

    function test_placeBet_fail_underMinBid() public {
        _createMarket(1 days, 1000);
        vm.expectRevert("BetRegistry::placeBet: amount must be greater than MIN_BID.");
        betRegistry.placeBet(0, 1e18 - 1, IBetRegistry.BetDirection.HIGHER);
    }

    function test_placeBet_fail_marketEnded() public {
        _createMarket(1 days, 1000);
        vm.warp(2 days);
        _dealAndApprove(address(this), 200);
        vm.expectRevert("BetRegistry::placeBet: market has ended.");
        betRegistry.placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
    }

    function test_resolveMarket_fail_notEnded() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);

        vm.expectRevert("BetRegistry::resolveMarket: market has not ended.");
        betRegistry.resolveMarket(0);
    }

    function test_resolveMarket_fail_gracePeriod() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 59);
        vm.expectRevert("BetRegistry::resolveMarket: grace period not over.");
        betRegistry.resolveMarket(0);
    }

    function test_resolveMarket_setsEndPriceAndTotalDegen() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);

        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.endPrice, DEGEN_PRICE_1, "endPrice");
        assertEq(market.totalDegen / 1e18, 196, "totalDegen");
    }

    function test_resolveMarket_unsteaksDegen() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);

        // before resolve all degen should be steaked and market should have all steaks and no degen
        assertEq(degenToken.balanceOf(address(betRegistry)), 0, "DEGEN before");
        assertEq(
            _getMarket(0).totalSteakedDegen, SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT, "totalSteakedDegen before"
        );
        assertEq(
            steakedDegen.balanceOf(address(betRegistry)),
            SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT,
            "SteakedDegen DEGEN before"
        );

        betRegistry.resolveMarket(0);

        // after resolve, all degen should be unsteaked and market should have no steaks but all degen
        assertEq(degenToken.balanceOf(address(betRegistry)) / 1e18, 196, "betRegistry DEGEN after, two bets minus fee");
        assertEq(
            degenToken.balanceOf(address(steakedDegen)) / 1e18,
            101,
            "total SteakedDegen DEGEN after, initial stake plus fee"
        );
        assertEq(steakedDegen.balanceOf(address(betRegistry)), 0, "betRegistry SteakedDegen DEGEN after");
    }

    function test_resolveMarket_sendsFeeToCreator() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);

        assertEq(degenToken.balanceOf(address(this)) / 1e18, 0, "owner degen before should be 0");

        betRegistry.resolveMarket(0);

        assertEq(degenToken.balanceOf(address(this)) / 1e16, 136, "owner degen after should be ~1.36");
    }

    function test_cashOut_fail_marketNotResolved() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.expectRevert("BetRegistry::cashOut: market not resolved.");
        _cashOut(0);
    }

    function test_cashOut_HIGHER_basic() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);

        // before cashOut, all degen should be unsteaked and market should have no steaks but all degen
        assertEq(degenToken.balanceOf(address(betRegistry)) / 1e18, 196, "betRegistry DEGEN before, two bets minus fee");

        _cashOut(0);

        // after cashOut, all degen should be steaked and market should have all steaks and no degen
        assertEq(degenToken.balanceOf(address(betRegistry)), 0, "DEGEN after");
        assertEq(degenToken.balanceOf(ALICE) / 1e18, 196, "Alice DEGEN after");
    }

    function test_cashOut_HIGHER_fail_onlyOnce() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        _cashOut(0);

        vm.expectRevert("BetRegistry::cashOut: market has no degen.");

        _cashOut(0);
    }

    function test_cashOut_HIGHER_fail_withoutBet() public {
        _createMarket(1 days, 1000);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.expectRevert("BetRegistry::cashOut: market has no degen.");
        _cashOut(0);
    }

    function test_cashOut_HIGHER_fail_wrongBet() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.expectRevert("BetRegistry::cashOut: Nothing to cash out.");
        _cashOut(0);
    }

    function test_cashOut_HIGHER_fail_afterSlash() public {
        _createMarket(1 days, DEGEN_PRICE_1 - 1);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.warp(1 days + 60 + 4 weeks);
        betRegistry.slash(0);
        vm.expectRevert("BetRegistry::cashOut: market has no degen.");
        _cashOut(0);
    }

    function test_cashOut_LOWER_basic() public {
        _createMarket(1 days, DEGEN_PRICE_1 + 1);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);

        // before cashOut, all degen should be unsteaked and market should have no steaks but all degen
        assertEq(degenToken.balanceOf(address(betRegistry)) / 1e18, 196, "betRegistry DEGEN before, two bets minus fee");

        _cashOut(0);

        // after cashOut, all degen should be steaked and market should have all steaks and no degen
        assertEq(degenToken.balanceOf(address(betRegistry)), 0, "DEGEN after");
        assertEq(degenToken.balanceOf(ALICE) / 1e18, 196, "Alice DEGEN after");
    }

    function test_cashOut_LOWER_fail_onlyOnce() public {
        _createMarket(1 days, DEGEN_PRICE_1 + 1);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        _cashOut(0);

        vm.expectRevert("BetRegistry::cashOut: market has no degen.");

        _cashOut(0);
    }

    function test_cashOut_LOWER_fail_withoutBet() public {
        _createMarket(1 days, DEGEN_PRICE_1 + 1);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.expectRevert("BetRegistry::cashOut: market has no degen.");
        _cashOut(0);
    }

    function test_cashOut_LOWER_fail_afterSlash() public {
        _createMarket(1 days, DEGEN_PRICE_1 + 1);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.warp(1 days + 60 + 4 weeks);
        betRegistry.slash(0);
        vm.expectRevert("BetRegistry::cashOut: market has no degen.");
        _cashOut(0);
    }

    function test_cashOut_LOWER_fail_wrongBet() public {
        _createMarket(1 days, DEGEN_PRICE_1 + 1);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.expectRevert("BetRegistry::cashOut: Nothing to cash out.");
        _cashOut(0);
    }

    function test_slash_basic_fail_slashPeriodNotOver() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);

        vm.expectRevert("BetRegistry::slash: Slash period not over.");
        betRegistry.slash(0);
    }

    function test_slash_basic() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.warp(1 days + 60 + 4 weeks);

        assertEq(degenToken.balanceOf(address(betRegistry)) / 1e18, 196, "betRegistry DEGEN before, two bets minus fee");
        uint256 daoBalanceBefore = degenToken.balanceOf(DEGEN_UTILITY_DAO);

        vm.prank(BOB);
        betRegistry.slash(0);

        assertEq(degenToken.balanceOf(address(betRegistry)), 0, "betRegistry DEGEN after");
        assertEq(degenToken.balanceOf(BOB) / 1e18, 1, "BOB DEGEN after");
        assertEq(degenToken.balanceOf(address(this)) / 1e18, 2, "Creator DEGEN after");
        assertGt(degenToken.balanceOf(DEGEN_UTILITY_DAO), daoBalanceBefore, "DAO should have received some DEGEN");
        assertEq(degenToken.balanceOf(address(steakedDegen)) / 1e18, 293, "Steak DEGEN after");
        assertEq(_getMarket(0).totalDegen, 0, "market totalDegen after");
        assertEq(_getMarket(0).totalHigher, 0, "market totalHigher after");
        assertEq(_getMarket(0).totalLower, 0, "market totalLower after");
    }

    function test_slash_onlyOnce() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);
        betRegistry.resolveMarket(0);
        vm.warp(1 days + 60 + 4 weeks);
        betRegistry.slash(0);

        vm.expectRevert("BetRegistry::slash: Nothing to slash.");
        betRegistry.slash(0);
    }
}
