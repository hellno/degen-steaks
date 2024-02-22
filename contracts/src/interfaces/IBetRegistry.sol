// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IBetRegistry {
    struct Market {
        address creator;
        uint40 endTime;
        uint256 targetPrice;
        uint256 totalHigher;
        uint256 totalLower;
    }

    struct Bet {
        uint256 amountHigher;
        uint256 amountLower;
    }

    event MarketCreated(uint256 indexed betId, address indexed creator, uint40 endTime, uint256 targetPrice);
}
