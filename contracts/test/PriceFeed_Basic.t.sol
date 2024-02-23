// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithUtility} from "test/setup/WithUtility.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import "test/setup/Constants.t.sol";

contract PriceFeed_Basic_Test is Test, WithUtility {
    function setUp() public {
        deploy();
    }

    function test_getPrice() public {
        // token0 is WETH
        // 0.000000296172 WETH per DEGEN
        // 3653560 DEGEN per WETH
        // assertEq(priceFeed.getPrice(), 3653560);
    }
}
