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
}
