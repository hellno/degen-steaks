// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "src/auxiliary/DegenPool.sol";

import "forge-std/console2.sol";

contract PriceFeed {
    DegenPool public pool;

    constructor(DegenPool pool_) {
        pool = pool_;
    }

    function getPrice() external view returns (int256) {
        (int56[] memory tickCumulatives,) = pool.observe(new uint32[](2));

        int56 tickCumulative = tickCumulatives[1] - tickCumulatives[0];
        int56 avgTickCumulative = tickCumulative / 60; // 0, 60 seconds
        console2.log("avgTickCumulative", avgTickCumulative);
        return 100000000;
    }
}
