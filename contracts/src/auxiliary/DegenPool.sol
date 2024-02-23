// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

/// @dev mocks DEGEN/ETH pool
contract DegenPool {
    function observe(uint32[] calldata)
        external
        pure
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)
    {
        tickCumulatives = new int56[](2);
        tickCumulatives[0] = 633392864764;
        tickCumulatives[1] = 633383789976;

        secondsPerLiquidityCumulativeX128s = new uint160[](2);
        secondsPerLiquidityCumulativeX128s[0] = 4391059661395041057633;
        secondsPerLiquidityCumulativeX128s[1] = 4391016456422726125266;
    }
}
