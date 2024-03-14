// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./interfaces/IBetRegistry.sol";
import "src/interfaces/IPriceFeed.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin/interfaces/IERC4626.sol";
import "openzeppelin/utils/math/Math.sol";

contract BetRegistry is IBetRegistry {
    using SafeERC20 for IERC20;
    using Math for uint256;

    uint256 constant MARKET_FEE = 69 * 1e2; // 0.69%
    uint256 constant FEE_DIVISOR = 1e6; // 1% = 1e4: 1 BPS = 1e2

    uint256 constant MIN_BID = 1e18; // 1 DEGEN
    uint256 constant GRACE_PERIOD = 60; // 60 seconds between end of a market and resolution.

    Market[] public markets;
    mapping(uint256 marketId => mapping(address user => Bet)) public marketToUserToBet;
    IERC20 public degenToken;

    IERC4626 steakedDegen;
    IPriceFeed priceFeed;
    address public degenUtilityDao;

    constructor(IERC20 degenToken_, IERC4626 steakedDegen_, IPriceFeed priceFeed_, address degenUtilityDao_) {
        degenToken = IERC20(degenToken_);
        steakedDegen = steakedDegen_;
        priceFeed = priceFeed_;
        degenUtilityDao = degenUtilityDao_;
    }

    function getMarket(uint256 marketId_) public view returns (Market memory) {
        if (marketId_ >= markets.length) {
            revert("BetRegistry::getMarket: marketId out of range.");
        }
        return markets[marketId_];
    }

    function getBet(uint256 marketId_, address user_) public view returns (Bet memory) {
        return marketToUserToBet[marketId_][user_];
    }

    function createMarket(uint40 endTime_, uint256 targetPrice_) public {
        markets.push(
            Market({
                creator: msg.sender,
                endTime: endTime_,
                targetPrice: targetPrice_,
                endPrice: 0,
                totalHigher: 0,
                totalLower: 0,
                totalSteakedDegen: 0
            })
        );

        emit MarketCreated(markets.length - 1, msg.sender, endTime_, targetPrice_);
    }

    function placeBet(uint256 marketId_, uint256 amount_, BetDirection direction_) public {
        require(marketId_ < markets.length, "BetRegistry::placeBet: marketId out of range.");
        require(amount_ > MIN_BID, "BetRegistry::placeBet: amount must be greater than MIN_BID.");
        Market storage market = markets[marketId_];
        require(block.timestamp < market.endTime, "BetRegistry::placeBet: market has ended.");

        degenToken.safeTransferFrom(msg.sender, address(this), amount_);

        // deposit to steakedDegen
        degenToken.approve(address(steakedDegen), amount_);
        uint256 steaks = steakedDegen.deposit(amount_, address(this));

        // pay fee to totalStDegen in Market
        uint256 feeAmount = market.totalSteakedDegen == 0 ? 0 : steaks.mulDiv(MARKET_FEE, FEE_DIVISOR);
        market.totalSteakedDegen += feeAmount;
        steaks -= feeAmount;

        Bet storage bet = marketToUserToBet[marketId_][msg.sender];

        // virtual shares of the market
        // market.totalHigher + market.totalLower == 0 means this is the first bet
        uint256 betShares = market.totalHigher + market.totalLower == 0
            ? steaks
            : steaks.mulDiv(market.totalHigher + market.totalLower, market.totalSteakedDegen);
        market.totalSteakedDegen += steaks;

        if (direction_ == BetDirection.HIGHER) {
            bet.amountHigher += betShares;
            market.totalHigher += betShares;
        } else {
            bet.amountLower += betShares;
            market.totalLower += betShares;
        }

        emit BetPlaced(marketId_, msg.sender, amount_, steaks, betShares, feeAmount, direction_);
    }

    function resolveMarket(uint256 marketId_) public {
        Market storage market = markets[marketId_];
        require(block.timestamp >= market.endTime, "BetRegistry::resolveMarket: market has not ended.");
        require(block.timestamp >= market.endTime + GRACE_PERIOD, "BetRegistry::resolveMarket: grace period not over.");
        uint256 price = priceFeed.getPrice();
        market.endPrice = price;
    }
}
