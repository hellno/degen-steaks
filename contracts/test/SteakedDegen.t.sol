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

        assertEq(faucetToken.balanceOf(ALICE), 0, "ALICE should have 0 DEGEN");
        assertEq(
            faucetToken.balanceOf(address(steakedDegen)),
            INITIAL_STAKE + 100 * 1e18,
            "SteakedDegen should have received 100*1e18 DEGEN"
        );
        assertEq(
            steakedDegen.balanceOf(ALICE), 99.31 * 1e18 * INITIAL_STAKE / (INITIAL_STAKE + 0.69 * 1e18), "ALICE SDEGEN"
        );
    }

    function test_deposit_multiple() public {
        _deposit(ALICE, 100 * 1e18);
        _deposit(BOB, 100 * 1e18);

        assertEq(faucetToken.balanceOf(ALICE), 0, "ALICE should have 0 DEGEN");
        assertEq(faucetToken.balanceOf(BOB), 0, "ALICE should have 0 DEGEN");
        assertEq(faucetToken.balanceOf(address(steakedDegen)), 300 * 1e18, "SteakedDegen should have 300*1e18 DEGEN");
        assertEq(
            steakedDegen.balanceOf(ALICE), 99.31 * 1e18 * INITIAL_STAKE / (INITIAL_STAKE + 0.69 * 1e18), "ALICE SDEGEN"
        );
        assertEq(
            steakedDegen.balanceOf(BOB),
            99.31 * 1e18 * (INITIAL_STAKE + 99.31 * 1e18 * INITIAL_STAKE / (INITIAL_STAKE + 0.69 * 1e18))
                / (INITIAL_STAKE * 2 + 0.69 * 1e18),
            "BOB SDEGEN"
        );
    }

    function test_withdraw_basic() public {
        _deposit(ALICE, 100 * 1e18);
        _withdraw(ALICE, steakedDegen.maxWithdraw(ALICE));
        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 steakedDegen");
        assertEq(
            faucetToken.balanceOf(address(steakedDegen)),
            1 + INITIAL_STAKE + 0.69 * 1e18,
            "SteakedDegen should have 1 dust DEGEN"
        );
        assertEq(faucetToken.balanceOf(address(ALICE)), 99.31 * 1e18 - 1, "Alice should have received 99.31 DEGEN back");
        assertEq(steakedDegen.balanceOf(ALICE), 0, "ALICE should have 0 SDEGEN");
    }

    function test_initialDeposit() public {
        assertEq(faucetToken.balanceOf(address(this)), 0, "this should have 0 DEGEN");
        assertEq(faucetToken.balanceOf(DEGEN_UTILITY_DAO), 0, "DAO should have 0 DEGEN");

        assertEq(
            faucetToken.balanceOf(address(steakedDegen)),
            INITIAL_STAKE,
            "SteakedDegen should have received 1000*1e18 DEGEN"
        );
        assertEq(steakedDegen.totalSupply(), INITIAL_STAKE, "SteakedDegen.totalSupply() should be 1000*1e18 SDEGEN");
    }
}
