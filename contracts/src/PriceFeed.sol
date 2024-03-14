// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "src/interfaces/IPriceFeed.sol";
import "src/auxiliary/EthDegenPool.sol";
import "src/auxiliary/EthUsdcPool.sol";
import "lib/uniswap-v3/OracleLibrary.sol";

address constant WETH_BASE = 0x4200000000000000000000000000000000000006;
address constant DEGEN_BASE = 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed;
address constant USDC_BASE = 0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA;

contract PriceFeed is IPriceFeed {
    IUniswapV3Pool public ethDegenPool;
    IUniswapV3Pool public ethUsdcPool;

    constructor(address ethDegenPool_, address ethUsdcPool_) {
        ethDegenPool = IUniswapV3Pool(ethDegenPool_);
        ethUsdcPool = IUniswapV3Pool(ethUsdcPool_);
    }

    /// @dev returns the usdc value of 1 mio DEGEN
    function getPrice() external view returns (uint256) {
        return degenToUsdc(1e6 * 1e18);
    }

    function degenToUsdc(uint128 degenAmount_) public view returns (uint256) {
        uint256 quoteEth = degenToEth(degenAmount_);
        uint256 quoteUsdc = ethToUsdc(uint128(quoteEth));
        return quoteUsdc;
    }

    function degenToEth(uint128 degenAmount_) public view returns (uint256) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = 0;
        secondsAgos[1] = 60;
        (int56[] memory tickCumulatives,) = ethDegenPool.observe(secondsAgos);
        int56 tickCumulative = tickCumulatives[1] - tickCumulatives[0];
        int56 avgTickCumulative = tickCumulative / 60; // 0, 60 seconds
        uint256 quote = OracleLibrary.getQuoteAtTick(int24(avgTickCumulative), degenAmount_, WETH_BASE, DEGEN_BASE);
        return quote;
    }

    function ethToUsdc(uint128 ethAmount_) public view returns (uint256) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = 0;
        secondsAgos[1] = 60;
        (int56[] memory tickCumulatives,) = ethUsdcPool.observe(secondsAgos);
        int56 tickCumulative = tickCumulatives[1] - tickCumulatives[0];
        int56 avgTickCumulative = tickCumulative / 60; // 0, 60 seconds
        uint256 quote = OracleLibrary.getQuoteAtTick(int24(avgTickCumulative), ethAmount_, USDC_BASE, WETH_BASE);
        return quote;
    }
}
