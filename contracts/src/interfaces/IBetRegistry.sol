// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/interfaces/IERC4626.sol";
import "src/interfaces/IPriceFeed.sol";

interface IBetRegistry {
    enum BetDirection {
        HIGHER,
        LOWER
    }

    enum MarketStatus {
        OPEN,
        RESOLVED,
        ERROR
    }

    struct Market {
        address creator;
        uint40 endTime;
        MarketStatus status;
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
    event MarketResolved(
        uint256 indexed marketId, uint256 endPrice, uint256 totalDegen, uint256 creatorFee, MarketStatus status
    );
    event BetCashedOut(uint256 indexed marketId, address indexed user, uint256 degen, uint256 marketShares);
    event MarketSlashed(
        uint256 indexed marketId,
        uint256 totalDegen,
        uint256 creatorFee,
        uint256 slashFee,
        uint256 daoFee,
        address slasher
    );
    event FanSet(address indexed user, bool isFan);
    event GracePeriodSet(uint256 gracePeriod);
    event SlashPeriodSet(uint256 slashPeriod);

    function createMarket(uint40 endTime, uint256 targetPrice) external returns (uint256 marketId);
    function getMarket(uint256 marketId) external view returns (Market memory);
    function placeBet(uint256 marketId, uint256 amount, BetDirection direction) external;
    function getBet(uint256 marketId, address user) external view returns (Bet memory);
    function resolveMarket(uint256 marketId) external;
    function cashOut(uint256 marketId) external;
    function slash(uint256 marketId) external;
    function setFan(address user, bool isFan) external;
    function isFan(address user) external view returns (bool);
    function degenToken() external view returns (IERC20);
    function steakedDegen() external view returns (IERC4626);
    function priceFeed() external view returns (IPriceFeed);
    function setGracePeriod(uint256 gracePeriod) external;
    function gracePeriod() external view returns (uint256);
    function setSlashPeriod(uint256 slashPeriod) external;
    function slashPeriod() external view returns (uint256);
}
