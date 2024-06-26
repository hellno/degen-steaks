// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithTestHelpers} from "test/setup/WithTestHelpers.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import "test/setup/Constants.t.sol";
import "openzeppelin/access/Ownable.sol";

contract SteakedDegen_Basic_Test is Test, WithTestHelpers {
    function setUp() public {
        deploy();
    }

    function test_setFan_success() public {
        vm.expectEmit();
        emit FanSet(ALICE, true);
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

        vm.expectEmit();
        emit SteakFeePaid(ALICE, 0.0069 * 1e18 * 100);
        emit DaoFeePaid(ALICE, 0.0069 * 1e18 * 100);

        vm.prank(ALICE);
        steakedDegen.deposit(100 * 1e18, ALICE);

        assertEq(degenToken.balanceOf(ALICE), 0, "ALICE should have 0 DEGEN");
        assertEq(degenToken.balanceOf(address(steakedDegen)), 2 * INITIAL_STAKE, "SteakedDegen DEGEN");
        assertEq(steakedDegen.balanceOf(ALICE), SDEGENS_SECOND_DEPOSIT + 1, "ALICE SDEGEN");
    }

    function test_deposit_multiple() public {
        _deposit(ALICE, 100 * 1e18);
        _deposit(BOB, 100 * 1e18);

        assertEq(degenToken.balanceOf(ALICE), 0, "ALICE should have 0 DEGEN");
        assertEq(degenToken.balanceOf(BOB), 0, "ALICE should have 0 DEGEN");
        assertEq(degenToken.balanceOf(address(steakedDegen)), 3 * INITIAL_STAKE, "SteakedDegen DEGEN");
        assertEq(steakedDegen.balanceOf(ALICE), SDEGENS_SECOND_DEPOSIT + 1, "ALICE SDEGEN");
        assertEq(steakedDegen.balanceOf(BOB), SDEGENS_THIRD_DEPOSIT + 1, "BOB SDEGEN");
    }

    function test_deposit_fail_notInitialized() public {
        deployWithoutInitialDeposit();

        steakedDegen.setFan(ALICE, true);
        _dealAndApprove(ALICE, address(steakedDegen), INITIAL_STAKE);
        vm.prank(ALICE);

        vm.expectRevert("SteakedDegen::whenInitialized: not initialized.");
        steakedDegen.deposit(INITIAL_STAKE, ALICE);
    }

    function test_initialDeposit_event() public {
        deployWithoutInitialDeposit();

        uint256 amount = 123 * 1e18;
        uint256 shares = amount; // ratio should be 1:1 on initial deposit

        steakedDegen.setFan(address(this), true);
        _dealAndApprove(address(this), address(steakedDegen), amount);

        vm.expectEmit();
        emit InitialDeposit(address(this), DEGEN_UTILITY_DAO, amount, shares);

        vm.prank(address(this));
        steakedDegen.initialDeposit(amount, DEGEN_UTILITY_DAO);
    }

    function test_withdraw_basic() public {
        _deposit(ALICE, 100 * 1e18);
        _withdraw(ALICE, steakedDegen.maxWithdraw(ALICE));
        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 steakedDegen");
        assertEq(degenToken.balanceOf(address(steakedDegen)), INITIAL_STAKE * 2 - DEGEN_2, "SteakedDegen DEGEN");
        assertEq(degenToken.balanceOf(address(ALICE)), DEGEN_2, "Alice should have received 99.31 DEGEN back");
        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 SDEGEN");
    }

    function test_withdraw_multiple() public {
        _deposit(ALICE, INITIAL_STAKE);
        _deposit(BOB, INITIAL_STAKE);

        _withdraw(ALICE, steakedDegen.maxWithdraw(ALICE));
        _withdraw(BOB, steakedDegen.maxWithdraw(BOB));

        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 steakedDegen");
        assertEq(steakedDegen.balanceOf(BOB), 0, "BOB should have 0 steakedDegen");
        assertEq(degenToken.balanceOf(address(ALICE)), DEGEN_2_3 + 1, "Alice SDEGEN");
        assertEq(degenToken.balanceOf(address(BOB)), DEGEN_2 - 1, "BOB SDEGEN");
        assertGt(
            degenToken.balanceOf(address(ALICE)),
            degenToken.balanceOf(address(BOB)),
            "Alice should have more DEGEN than Bob"
        );
        assertEq(
            degenToken.balanceOf(address(steakedDegen)), INITIAL_STAKE * 3 - DEGEN_2 - DEGEN_2_3, "SteakedDegen DEGEN"
        );
    }

    function test_redeem_multiple() public {
        _deposit(ALICE, INITIAL_STAKE);
        _deposit(BOB, INITIAL_STAKE);

        _redeem(ALICE, steakedDegen.maxRedeem(ALICE));
        _redeem(BOB, steakedDegen.maxRedeem(BOB));

        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 steakedDegen");
        assertEq(steakedDegen.balanceOf(BOB), 0, "BOB should have 0 steakedDegen");
        assertGt(degenToken.balanceOf(ALICE), degenToken.balanceOf(BOB), "ALICE > BOB, should have received fee");
        assertLt(
            INITIAL_STAKE - degenToken.balanceOf(BOB),
            STEAK_FEE_AMOUNT * 2,
            "BOB should not have lost more than twice the steak fee amount"
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
