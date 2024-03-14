// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

/// @dev mocks DEGEN/ETH pool
contract EthDegenPool {
    int56[] public tickCumulatives;
    uint160[] public secondsPerLiquidityCumulativeX128s;

    constructor() {
        // https://basescan.org/address/0xc9034c3E7F58003E6ae0C8438e7c8f4598d5ACAA
        tickCumulatives.push(634014745890);
        tickCumulatives.push(634005678098);

        secondsPerLiquidityCumulativeX128s.push(4393803726156327879739);
        secondsPerLiquidityCumulativeX128s.push(4393764076792916487575);
    }

    function observe(uint32[] calldata) external view returns (int56[] memory, uint160[] memory) {
        return (tickCumulatives, secondsPerLiquidityCumulativeX128s);
    }

    /// @dev Sets price to price at block ~11812708
    function togglePrice() external {
        tickCumulatives[0] = 881433984878;
        tickCumulatives[1] = 881425616080;

        secondsPerLiquidityCumulativeX128s[0] = 5172507467328360302808;
        secondsPerLiquidityCumulativeX128s[1] = 5172479472281388991202;
    }
}
