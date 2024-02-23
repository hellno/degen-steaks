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
        assertEq(faucetToken.balanceOf(address(steakedDegen)), 100 * 1e18, "SteakedDegen should have 100*1e18 DEGEN");
        assertEq(steakedDegen.balanceOf(ALICE), 99.31 * 1e18, "ALICE should have 99.31*1e18 SDEGEN");
    }

    function test_deposit_multiple() public {
        _deposit(ALICE, 100 * 1e18);
        _deposit(BOB, 100 * 1e18);

        assertEq(faucetToken.balanceOf(ALICE), 0, "ALICE should have 0 DEGEN");
        assertEq(faucetToken.balanceOf(BOB), 0, "ALICE should have 0 DEGEN");
        assertEq(faucetToken.balanceOf(address(steakedDegen)), 200 * 1e18, "SteakedDegen should have 200*1e18 DEGEN");
        assertEq(
            steakedDegen.balanceOf(ALICE),
            (1e6 - steakedDegen.steakFee()) * 100 * 1e18 / 1e6,
            "ALICE should have 99.31*1e18 SDEGEN"
        );
        assertEq(
            steakedDegen.balanceOf(BOB),
            (1e6 - steakedDegen.steakFee()) ** 2 * 100 * 1e18 / 1e6 ** 2,
            "BOB should have 98.624761*1e18 SDEGEN"
        );
    }
}
