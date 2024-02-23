// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IBetRegistry {
    enum BetDirection {
        HIGHER,
        LOWER
    }

    struct Market {
        address creator;
        uint40 endTime;
        uint256 targetPrice;
        uint256 totalHigher; // virtual shares
        uint256 totalLower; // virtual shares
        uint256 totalSteakedDegen;
    }

    struct Bet {
        uint256 amountHigher;
        uint256 amountLower;
    }

    event MarketCreated(uint256 indexed betId, address indexed creator, uint40 endTime, uint256 targetPrice);

    function createMarket(uint40 endTime, uint256 targetPrice) external;
    function getMarket(uint256 marketId) external view returns (Market memory);
    function placeBet(uint256 marketId, uint256 amount, BetDirection direction) external;
    function getBet(uint256 marketId, address user) external view returns (Bet memory);
}
