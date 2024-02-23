// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./interfaces/IBetRegistry.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin/interfaces/IERC4626.sol";

contract BetRegistry is IBetRegistry {
    using SafeERC20 for IERC20;

    uint256 constant MARKET_FEE = 69 * 1e2; // 0.69%
    uint256 constant FEE_DIVISOR = 1e6; // 1% = 1e4: 1 BPS = 1e2

    Market[] public markets;
    mapping(uint256 marketId => mapping(address user => Bet)) public marketToUserToBet;
    IERC20 public degenToken;

    IERC4626 steakedDegen;
    address public degenUtilityDao;

    constructor(IERC20 degenToken_, IERC4626 steakedDegen_, address degenUtilityDao_) {
        degenToken = IERC20(degenToken_);
        steakedDegen = steakedDegen_;
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
                totalHigher: 0,
                totalLower: 0,
                totalSteakedDegen: 0
            })
        );

        emit MarketCreated(markets.length - 1, msg.sender, endTime_, targetPrice_);
    }

    function placeBet(uint256 marketId_, uint256 amount_, BetDirection direction_) public {
        require(marketId_ < markets.length, "BetRegistry::placeBet: marketId out of range.");
        require(amount_ > 0, "BetRegistry::placeBet: amount must be greater than 0.");
        Market storage market = markets[marketId_];
        require(block.timestamp < market.endTime, "BetRegistry::placeBet: market has ended.");

        degenToken.safeTransferFrom(msg.sender, address(this), amount_);

        // deposit to steakedDegen

        degenToken.approve(address(steakedDegen), amount_);
        uint256 steaks = steakedDegen.deposit(amount_, address(this));

        // pay fee to totalStDegen in Market

        uint256 feeAmount = (steaks * MARKET_FEE) / FEE_DIVISOR;

        Bet storage bet = marketToUserToBet[marketId_][msg.sender];

        // virtual deposit of stDegen to steakedDegen

        market.totalSteakedDegen += steaks;

        // increase totalStDegen and totalSharesHigh and totalSharesLow in Market

        // increase totalSharesHigh and totalSharesLow in Bet of user

        if (direction_ == BetDirection.HIGHER) {
            bet.amountHigher += amount_;
            market.totalHigher += amount_;
        } else {
            bet.amountLower += amount_;
            market.totalLower += amount_;
        }
    }
}
