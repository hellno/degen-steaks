// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {WithTestHelpers} from "test/setup/WithTestHelpers.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import {MockPriceFeed} from "src/auxiliary/MockPriceFeed.sol";
import "test/setup/Constants.t.sol";

contract PriceFeed_Basic_Test is Test, WithTestHelpers {
    function setUp() public {
        deploy();
    }

    function test_getPrice() public {
        assertEq(priceFeed.degenToEth(1e6 * 1e18, 0), 273_450_722_395_988_893, "1mio degenToEth should be ~0.273");
        assertEq(priceFeed.ethToUsdc(1 * 1e18, 0), 2940_995_255, "ethToUsdc");
        assertEq(priceFeed.degenToUsdc(1e6 * 1e18, 0), 804_217_277, "1mio degenToUsdc should be ~$804");
        assertEq(priceFeed.getPrice(0), DEGEN_PRICE_1, "getPrice should be 804_217_277");
    }

    function test_togglePrice() public {
        assertEq(priceFeed.getPrice(0), DEGEN_PRICE_1, "getPrice should be 804_217_277");
        ethDegenPool.togglePrice();
        ethUsdcPool.togglePrice();
        assertEq(priceFeed.getPrice(0), DEGEN_PRICE_2, "getPrice should be 1_000_000_000");
    }

    function test_mockPriceFeed() public {
        MockPriceFeed mockPriceFeed = new MockPriceFeed();
        assertEq(mockPriceFeed.getPrice(0), 0, "getPrice should be 0");

        mockPriceFeed.setPrice(1_000_000_000);
        assertEq(mockPriceFeed.getPrice(0), 1_000_000_000, "getPrice should be 1_000_000_000");
    }
}
