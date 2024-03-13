// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithUtility} from "test/setup/WithUtility.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import "test/setup/Constants.t.sol";
import "openzeppelin/access/Ownable.sol";

contract BetRegistry_Basic_Test is Test, WithUtility {
    function setUp() public {
        deploy();
    }

    function test_setFan_success() public {
        steakedDegen.setFan(ALICE, true);
        assertTrue(steakedDegen.isFan(ALICE));
    }

    function test_setFan_onlyOwner() public {
        vm.prank(ALICE);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, ALICE));
        steakedDegen.setFan(ALICE, true);
    }

    function test_deposit_onlyFans() public {
        _dealAndApprove(ALICE, address(steakedDegen), 100);
        vm.prank(ALICE);
        vm.expectRevert("SteakedDegen::onlyFans: caller is not a fan.");
        steakedDegen.deposit(100, ALICE);
    }

    function test_deposit_success() public {
        steakedDegen.setFan(ALICE, true);
        _dealAndApprove(ALICE, address(steakedDegen), 100 * 1e18);
        vm.prank(ALICE);
        steakedDegen.deposit(100 * 1e18, ALICE);

        assertEq(degenToken.balanceOf(ALICE), 0, "ALICE should have 0 DEGEN");
        assertEq(degenToken.balanceOf(address(steakedDegen)), 2 * INITIAL_STAKE - DAO_FEE_AMOUNT, "SteakedDegen DEGEN");
        assertEq(
            steakedDegen.balanceOf(ALICE),
            STAKE_AFTER_FEES * INITIAL_STAKE / (INITIAL_STAKE + STEAK_FEE_AMOUNT),
            "ALICE SDEGEN"
        );
    }

    function test_deposit_multiple() public {
        _deposit(ALICE, 100 * 1e18);
        _deposit(BOB, 100 * 1e18);

        assertEq(degenToken.balanceOf(ALICE), 0, "ALICE should have 0 DEGEN");
        assertEq(degenToken.balanceOf(BOB), 0, "ALICE should have 0 DEGEN");
        assertEq(
            degenToken.balanceOf(address(steakedDegen)), 3 * INITIAL_STAKE - 2 * DAO_FEE_AMOUNT, "SteakedDegen DEGEN"
        );
        assertEq(
            steakedDegen.balanceOf(ALICE),
            STAKE_AFTER_FEES * INITIAL_STAKE / (INITIAL_STAKE + STEAK_FEE_AMOUNT),
            "ALICE SDEGEN"
        );
        assertEq(
            steakedDegen.balanceOf(BOB),
            STAKE_AFTER_FEES * (INITIAL_STAKE + SDEGENS_SECOND_DEPOSIT)
                / (2 * INITIAL_STAKE - DAO_FEE_AMOUNT + STEAK_FEE_AMOUNT),
            "BOB SDEGEN"
        );
    }

    function test_deposit_fail_notInitialized() public {
        deployWithoutInitialDeposit();

        steakedDegen.setFan(ALICE, true);
        _dealAndApprove(ALICE, address(steakedDegen), INITIAL_STAKE);
        vm.prank(ALICE);

        vm.expectRevert("SteakedDegen::whenInitialized: not initialized.");
        steakedDegen.deposit(INITIAL_STAKE, ALICE);
    }

    function test_withdraw_basic() public {
        _deposit(ALICE, 100 * 1e18);
        _withdraw(ALICE, steakedDegen.maxWithdraw(ALICE));
        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 steakedDegen");
        assertEq(
            degenToken.balanceOf(address(steakedDegen)),
            1 + INITIAL_STAKE + 0.69 * 1e18,
            "SteakedDegen should have 1 dust DEGEN"
        );
        assertEq(
            degenToken.balanceOf(address(ALICE)), STAKE_AFTER_FEES - 1, "Alice should have received 99.31 DEGEN back"
        );
        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 SDEGEN");
    }

    function test_withdraw_multiple() public {
        _deposit(ALICE, INITIAL_STAKE);
        _deposit(BOB, INITIAL_STAKE);

        _withdraw(ALICE, steakedDegen.maxWithdraw(ALICE));
        _withdraw(BOB, steakedDegen.maxWithdraw(BOB));

        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 steakedDegen");
        assertEq(steakedDegen.balanceOf(BOB), 0, "BOB should have 0 steakedDegen");
        assertEq(
            degenToken.balanceOf(address(ALICE)),
            STAKE_AFTER_FEES + STEAK_FEE_AMOUNT * SDEGENS_SECOND_DEPOSIT / (INITIAL_STAKE + SDEGENS_SECOND_DEPOSIT),
            "Alice SDEGEN"
        );
        assertEq(degenToken.balanceOf(address(BOB)), STAKE_AFTER_FEES, "BOB SDEGEN");
        assertEq(
            degenToken.balanceOf(address(ALICE))
                - STEAK_FEE_AMOUNT * SDEGENS_SECOND_DEPOSIT / (INITIAL_STAKE + SDEGENS_SECOND_DEPOSIT),
            degenToken.balanceOf(address(BOB)),
            "Alice should have more DEGEN than Bob"
        );
        assertEq(
            degenToken.balanceOf(address(steakedDegen)),
            INITIAL_STAKE + STEAK_FEE_AMOUNT
                + STEAK_FEE_AMOUNT * INITIAL_STAKE / (INITIAL_STAKE + SDEGENS_SECOND_DEPOSIT) + 1,
            "SteakedDegen DEGEN"
        );
    }

    function test_redeem_multiple() public {
        _deposit(ALICE, INITIAL_STAKE);
        _deposit(BOB, INITIAL_STAKE);

        _redeem(ALICE, steakedDegen.maxRedeem(ALICE));
        _redeem(BOB, steakedDegen.maxRedeem(BOB));

        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 steakedDegen");
        assertEq(steakedDegen.balanceOf(BOB), 0, "BOB should have 0 steakedDegen");
        assertEq(
            degenToken.balanceOf(address(ALICE)),
            STAKE_AFTER_FEES + STEAK_FEE_AMOUNT * SDEGENS_SECOND_DEPOSIT / (INITIAL_STAKE + SDEGENS_SECOND_DEPOSIT),
            "Alice SDEGEN"
        );
        assertEq(degenToken.balanceOf(address(BOB)), STAKE_AFTER_FEES, "BOB SDEGEN");
        assertEq(
            degenToken.balanceOf(address(ALICE))
                - STEAK_FEE_AMOUNT * SDEGENS_SECOND_DEPOSIT / (INITIAL_STAKE + SDEGENS_SECOND_DEPOSIT),
            degenToken.balanceOf(address(BOB)),
            "Alice should have more DEGEN than Bob"
        );
        assertEq(
            degenToken.balanceOf(address(steakedDegen)),
            INITIAL_STAKE + STEAK_FEE_AMOUNT
                + STEAK_FEE_AMOUNT * INITIAL_STAKE / (INITIAL_STAKE + SDEGENS_SECOND_DEPOSIT) + 1,
            "SteakedDegen DEGEN"
        );
    }

    function test_initialDeposit_success() public {
        deploy();

        assertEq(degenToken.balanceOf(address(this)), 0, "this should have 0 DEGEN");
        assertEq(degenToken.balanceOf(DEGEN_UTILITY_DAO), 0, "DAO should have 0 DEGEN");

        assertEq(
            degenToken.balanceOf(address(steakedDegen)),
            INITIAL_STAKE,
            "SteakedDegen should have received 1000*1e18 DEGEN"
        );
        assertEq(steakedDegen.totalSupply(), INITIAL_STAKE, "SteakedDegen.totalSupply() should be 1000*1e18 SDEGEN");
    }

    function test_initialDeposit_fail_alreadyInitialized() public {
        vm.expectRevert("SteakedDegen::initialDeposit: already initialized.");
        steakedDegen.initialDeposit(INITIAL_STAKE, DEGEN_UTILITY_DAO);
    }
}
