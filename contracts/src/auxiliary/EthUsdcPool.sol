// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

/// @dev mocks DEGEN/ETH pool
contract EthUsdcPool {
    int56[] public tickCumulatives;
    uint160[] public secondsPerLiquidityCumulativeX128s;

    constructor() {
        // https://basescan.org/address/0x4c36388be6f416a29c8d8eee81c771ce6be14b18
        tickCumulatives.push(-3548077334844);
        tickCumulatives.push(-3548065547526);

        secondsPerLiquidityCumulativeX128s.push(39859674628730532366928362655);
        secondsPerLiquidityCumulativeX128s.push(39859638006237693588194400295);
    }

    function observe(uint32[] calldata) external view returns (int56[] memory, uint160[] memory) {
        return (tickCumulatives, secondsPerLiquidityCumulativeX128s);
    }

    /// @dev Sets price to price at block ~11812708
    function togglePrice() external {
        tickCumulatives[0] = -3877711536046;
        tickCumulatives[1] = -3877699926748;

        secondsPerLiquidityCumulativeX128s[0] = 40986754765085421655622951391;
        secondsPerLiquidityCumulativeX128s[1] = 40986729906736644676633363845;
    }
}
