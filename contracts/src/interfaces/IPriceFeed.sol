// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IPriceFeed {
    function getPrice(uint32 secondsAgo) external view returns (uint256);

    function degenToUsdc(uint128 degenAmount, uint32 secondsAgo) external view returns (uint256);

    function degenToEth(uint128 degenAmount, uint32 secondsAgo) external view returns (uint256);

    function ethToUsdc(uint128 ethAmount, uint32 secondsAgo) external view returns (uint256);
}
