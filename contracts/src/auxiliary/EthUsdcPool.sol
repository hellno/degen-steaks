// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

/// @dev mocks DEGEN/ETH pool
contract EthUsdcPool {
    function observe(uint32[] calldata)
        external
        pure
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)
    {
        tickCumulatives = new int56[](2);
        tickCumulatives[0] = -3548077334844;
        tickCumulatives[1] = -3548065547526;

        secondsPerLiquidityCumulativeX128s = new uint160[](2);
        secondsPerLiquidityCumulativeX128s[0] = 39859674628730532366928362655;
        secondsPerLiquidityCumulativeX128s[1] = 39859638006237693588194400295;
    }
}
