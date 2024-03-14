// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IPriceFeed {
    function getPrice() external view returns (uint256);

    function degenToUsdc(uint128 degenAmountk) external view returns (uint256);

    function degenToEth(uint128 degenAmount) external view returns (uint256);

    function ethToUsdc(uint128 ethAmount) external view returns (uint256);
}
