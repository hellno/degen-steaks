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
        uint256 endPrice;
        uint256 totalHigher; // virtual shares
        uint256 totalLower; // virtual shares
        uint256 totalSteakedDegen;
        uint256 totalDegen;
    }

    struct Bet {
        uint256 amountHigher;
        uint256 amountLower;
    }

    event MarketCreated(uint256 indexed id, address indexed creator, uint40 endTime, uint256 targetPrice);
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        uint256 degen,
        uint256 steaks,
        uint256 feeSteaks,
        uint256 betShares,
        BetDirection direction
    );

    function createMarket(uint40 endTime, uint256 targetPrice) external;
    function getMarket(uint256 marketId) external view returns (Market memory);
    function placeBet(uint256 marketId, uint256 amount, BetDirection direction) external;
    function getBet(uint256 marketId, address user) external view returns (Bet memory);
    function resolveMarket(uint256 marketId) external;
    function cashOut(uint256 marketId) external;
    function slash(uint256 marketId) external;
    function setFan(address user, bool isFan) external;
}
