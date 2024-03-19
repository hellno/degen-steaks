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
    function getPrice(uint128 secondsAgo_) external view returns (uint256) {
        return degenToUsdc(1e6 * 1e18, secondsAgo_);
    }

    function degenToUsdc(uint128 degenAmount_, uint128 secondsAgo_) public view returns (uint256) {
        uint256 quoteEth = degenToEth(degenAmount_, secondsAgo_);
        uint256 quoteUsdc = ethToUsdc(uint128(quoteEth), secondsAgo_);
        return quoteUsdc;
    }

    function degenToEth(uint128 degenAmount_, uint128 secondsAgo_) public view returns (uint256) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = secondsAgo_ + 60;
        secondsAgos[1] = secondsAgo_;
        (int56[] memory tickCumulatives,) = ethDegenPool.observe(secondsAgos);
        int56 tickCumulativeDelta = tickCumulatives[1] - tickCumulatives[0];
        int56 avgTick = tickCumulativeDelta / 60; // 0, 60 seconds
        uint256 quote = OracleLibrary.getQuoteAtTick(int24(avgTick), degenAmount_, WETH_BASE, DEGEN_BASE);
        return quote;
    }

    function ethToUsdc(uint128 ethAmount_, uint128 secondsAgo_) public view returns (uint256) {
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = secondsAgo_ + 60;
        secondsAgos[1] = secondsAgo_;
        (int56[] memory tickCumulatives,) = ethUsdcPool.observe(secondsAgos);
        int56 tickCumulativeDelta = tickCumulatives[1] - tickCumulatives[0];
        int56 avgTick = tickCumulativeDelta / 60; // 0, 60 seconds
        uint256 quote = OracleLibrary.getQuoteAtTick(int24(avgTick), ethAmount_, USDC_BASE, WETH_BASE);
        return quote;
    }
}
