// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithTestHelpers} from "test/setup/WithTestHelpers.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import "test/setup/Constants.t.sol";

contract PriceFeed_Basic_Test is Test, WithTestHelpers {
    function setUp() public {
        deploy();
    }

    function test_getPrice() public {
        assertEq(priceFeed.degenToEth(1e6 * 1e18), 273_450_722_395_988_893, "1mio degenToEth should be ~0.273");
        assertEq(priceFeed.ethToUsdc(1 * 1e18), 2940_995_255, "ethToUsdc");
        assertEq(priceFeed.degenToUsdc(1e6 * 1e18), 804_217_277, "1mio degenToUsdc should be ~$804");
        assertEq(priceFeed.getPrice(), 804_217_277, "getPrice");
    }
}
