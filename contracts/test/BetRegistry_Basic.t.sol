// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithTestHelpers} from "test/setup/WithTestHelpers.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import "test/setup/Constants.t.sol";
import "openzeppelin/access/Ownable.sol";

contract BetRegistry_Basic_Test is Test, WithTestHelpers {
    function setUp() public {
        deploy();
    }

    function test_setFan_onlyOwner() public {
        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, ALICE));
        betRegistry.setFan(ALICE, true);
    }

    function test_setGracePeriod_onlyOwner() public {
        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, ALICE));
        betRegistry.setGracePeriod(1 days);
        assertEq(betRegistry.gracePeriod(), 60, "gracePeriod");
    }

    function test_setGracePeriod_success() public {
        vm.expectEmit();
        emit GracePeriodSet(1 days);
        betRegistry.setGracePeriod(1 days);
        assertEq(betRegistry.gracePeriod(), 1 days, "gracePeriod");
    }

    function test_setSlashPeriod_onlyOwner() public {
        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, ALICE));
        betRegistry.setSlashPeriod(1 days);
        assertEq(betRegistry.slashPeriod(), 4 weeks, "slashPeriod");
    }

    function test_setSlashPeriod_success() public {
        vm.expectEmit();
        emit SlashPeriodSet(1 days);
        betRegistry.setSlashPeriod(1 days);
        assertEq(betRegistry.slashPeriod(), 1 days, "slashPeriod");
    }

    function test_createMarket_fail_onlyFan() public {
        vm.prank(ALICE);
        vm.expectRevert("BetRegistry::onlyFans: caller is not a fan.");
        betRegistry.createMarket(1 days, 1000);
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
        assertEq(uint256(market.status), uint256(IBetRegistry.MarketStatus.OPEN), "status should be open");
    }

    function test_CreateMarket_returnsMarketId() public {
        assertEq(_createMarket(1 days, 1000), 0);
        assertEq(_createMarket(1 days, 1000), 1);
        assertEq(_createMarket(1 days, 1000), 2);
    }

    function test_createMarket_afterSetFan() public {
        vm.expectEmit();
        emit FanSet(ALICE, true);
        betRegistry.setFan(ALICE, true);
        _createMarket(1 days, 1000);
    }

    function test_createMarket_fail_endTime() public {
        vm.warp(1 days);
        vm.expectRevert("BetRegistry::createMarket: endTime must be in the future.");
        betRegistry.createMarket(1 days, 1000);
    }

    function test_createMarket_fail_priceIsZero() public {
        vm.expectRevert("BetRegistry::createMarket: targetPrice must be greater than zero.");
        betRegistry.createMarket(1 days, 0);
    }

    function test_getMarket_fail_outOfRange() public {
        vm.expectRevert("BetRegistry::getMarket: marketId out of range.");
        _getMarket(1);
    }

    function test_placeBet_higher() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);

        IBetRegistry.Market memory market = _getMarket(0);
        assertEq(market.totalHigher / 1e6, SDEGENS_SECOND_DEPOSIT / 1e6, "totalHigher");
        assertEq(market.totalLower, 0, "totalLower");

        IBetRegistry.Bet memory bet = _getBet(0, ALICE);
        assertEq(bet.amountHigher / 1e6, SDEGENS_SECOND_DEPOSIT / 1e6, "amountHigher");
        assertEq(bet.amountLower, 0, "amountLower");
    }

    function test_placeBet_lower() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        IBetRegistry.Market memory market = _getMarket(0);

        assertEq(market.totalHigher, 0);
        assertEq((market.totalLower) / 1e6, (SDEGENS_SECOND_DEPOSIT) / 1e6);
        assertEq(market.totalSteakedDegen / 1e6, SDEGENS_SECOND_DEPOSIT / 1e6, "totalSteakedDegen");

        IBetRegistry.Bet memory bet = _getBet(0, ALICE);
        assertEq(bet.amountHigher, 0);
        assertEq(bet.amountLower / 1e6, SDEGENS_SECOND_DEPOSIT / 1e6);
    }

    function test_placeBet_lower_twice() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        IBetRegistry.Market memory market = _getMarket(0);

        assertEq(
            market.totalSteakedDegen / 1e6, (SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT) / 1e6, "totalSteakedDegen"
        );
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
            market.totalSteakedDegen / 1e6,
            (SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT + SDEGENS_FOURTH_DEPOSIT + SDEGENS_FIFTH_DEPOSIT) / 1e6,
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
        vm.expectRevert("BetRegistry::placeBet: amount must be at least MIN_BID.");
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
        assertEq(uint256(market.status), uint256(IBetRegistry.MarketStatus.RESOLVED), "status should be resolved");
    }

    function test_resolveMarket_unsteaksDegen() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);

        // before resolve all degen should be steaked and market should have all steaks and no degen
        assertEq(degenToken.balanceOf(address(betRegistry)), 0, "DEGEN before");
        assertEq(
            _getMarket(0).totalSteakedDegen,
            SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT + 2,
            "totalSteakedDegen before"
        );
        assertEq(
            steakedDegen.balanceOf(address(betRegistry)),
            SDEGENS_SECOND_DEPOSIT + SDEGENS_THIRD_DEPOSIT + 2,
            "SteakedDegen DEGEN before"
        );

        betRegistry.resolveMarket(0);

        // after resolve, all degen should be unsteaked and market should have no steaks but all degen
        assertEq(degenToken.balanceOf(address(betRegistry)) / 1e18, 196, "betRegistry DEGEN after, two bets minus fee");
        assertEq(
            degenToken.balanceOf(address(steakedDegen)) / 1e18,
            102,
            "total SteakedDegen DEGEN after, initial stake plus fee plus dao fee"
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

    function test_resolveMarket_event() public {
        _createMarket(1 days, 1000);
        _placeBet(0, BET, IBetRegistry.BetDirection.HIGHER);
        _placeBet(0, BET, IBetRegistry.BetDirection.LOWER);
        vm.warp(1 days + 60);

        uint256 creatorBalanceBefore = degenToken.balanceOf(address(this));

        uint256 creatorFee = 1363369464235605000;
        uint256 totalDegen = 196226407961214395000;

        vm.expectEmit();
        emit MarketResolved(0, DEGEN_PRICE_1, totalDegen, creatorFee, IBetRegistry.MarketStatus.RESOLVED);
        betRegistry.resolveMarket(0);

        assertEq(degenToken.balanceOf(address(this)), creatorBalanceBefore + creatorFee, "creator balance after");
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

        vm.expectEmit();

        emit BetCashedOut(0, ALICE, 196226407961214395000, 96276603151128987096);
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
        uint256 creatorBalanceBefore = degenToken.balanceOf(address(this));
        uint256 steakedDegenBalanceBefore = degenToken.balanceOf(address(steakedDegen));
        uint256 slashBalanceBefore = degenToken.balanceOf(BOB);

        uint256 totalDegen = 192164521316417257025;
        uint256 creatorFee = 1353962214932379325;
        uint256 slashFee = creatorFee;
        uint256 daoFee = creatorFee;

        vm.expectEmit();
        emit MarketSlashed(0, totalDegen, creatorFee, slashFee, daoFee, BOB);

        vm.prank(BOB);
        betRegistry.slash(0);

        assertEq(degenToken.balanceOf(address(betRegistry)), 0, "betRegistry DEGEN after");
        assertEq(degenToken.balanceOf(BOB), slashBalanceBefore + slashFee, "BOB DEGEN after");
        assertEq(degenToken.balanceOf(address(this)), creatorBalanceBefore + creatorFee, "Creator DEGEN after");
        assertEq(
            degenToken.balanceOf(DEGEN_UTILITY_DAO), daoBalanceBefore + daoFee, "DAO should have received some DEGEN"
        );
        assertEq(
            degenToken.balanceOf(address(steakedDegen)), steakedDegenBalanceBefore + totalDegen, "Steak DEGEN after"
        );
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
