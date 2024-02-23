// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

/// @dev mocks DEGEN/ETH pool
contract EthDegenPool {
    function observe(uint32[] calldata)
        external
        pure
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)
    {
        tickCumulatives = new int56[](2);
        tickCumulatives[0] = 634014745890;
        tickCumulatives[1] = 634005678098;

        secondsPerLiquidityCumulativeX128s = new uint160[](2);
        secondsPerLiquidityCumulativeX128s[0] = 4393803726156327879739;
        secondsPerLiquidityCumulativeX128s[1] = 4393764076792916487575;
    }
}
