// SPDX-License-Identifier: BUSL 1.1
pragma solidity ^0.8.18;

import "./interfaces/IBetRegistry.sol";
import "src/interfaces/IPriceFeed.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin/interfaces/IERC4626.sol";
import "openzeppelin/utils/math/Math.sol";
import "openzeppelin/access/Ownable2Step.sol";

contract BetRegistry is IBetRegistry, Ownable2Step {
    using SafeERC20 for IERC20;
    using Math for uint256;

    /// @dev market fee gets distributed to all previously existant market participants
    uint256 constant MARKET_FEE = 69 * 1e2; // 0.69%: 69 BPS
    /// @dev creator fee is paid to the creator of the market, when the market get successfully resolved
    uint256 constant CREATOR_FEE = 69 * 1e2; // 0.69%; 69 BPS
    uint256 constant FEE_DIVISOR = 1e6; // 1% = 1e4: 1 BPS = 1e2

    uint256 public slashPeriod = 4 weeks; // 4 weeks after grace period to slash unclaimed funds.
    uint256 constant MIN_BID = 1e18; // 1 DEGEN
    uint256 public gracePeriod = 60; // 60 seconds between end of a market and resolution.

    Market[] public markets;
    mapping(uint256 marketId => mapping(address user => Bet)) public marketToUserToBet;
    IERC20 public degenToken;

    IERC4626 public steakedDegen;
    IPriceFeed public priceFeed;
    address public degenUtilityDao;

    mapping(address => bool) public isFan; // haha just kidding, it's a pun. onlyDepositer would be a better name.

    constructor(IERC20 degenToken_, IERC4626 steakedDegen_, IPriceFeed priceFeed_, address degenUtilityDao_)
        Ownable(msg.sender)
    {
        degenToken = IERC20(degenToken_);
        steakedDegen = steakedDegen_;
        priceFeed = priceFeed_;
        degenUtilityDao = degenUtilityDao_;
        isFan[msg.sender] = true;
    }

    modifier onlyFans() {
        require(isFan[_msgSender()], "BetRegistry::onlyFans: caller is not a fan.");
        _;
    }

    function setFan(address fan_, bool isFan_) public onlyOwner {
        isFan[fan_] = isFan_;
        emit FanSet(fan_, isFan_);
    }

    function setGracePeriod(uint256 gracePeriod_) public onlyOwner {
        gracePeriod = gracePeriod_;
        emit GracePeriodSet(gracePeriod_);
    }

    function setSlashPeriod(uint256 slashPeriod_) public onlyOwner {
        slashPeriod = slashPeriod_;
        emit SlashPeriodSet(slashPeriod_);
    }

    /// @dev creates a market where users can place bets on the price of DEGEN.
    function createMarket(uint40 endTime_, uint256 targetPrice_) public onlyFans returns (uint256) {
        require(endTime_ > block.timestamp, "BetRegistry::createMarket: endTime must be in the future.");
        require(targetPrice_ > 0, "BetRegistry::createMarket: targetPrice must be greater than zero.");
        markets.push(
            Market({
                creator: msg.sender,
                endTime: endTime_,
                status: MarketStatus.OPEN,
                targetPrice: targetPrice_,
                endPrice: 0,
                totalHigher: 0,
                totalLower: 0,
                totalSteakedDegen: 0,
                totalDegen: 0
            })
        );

        emit MarketCreated(markets.length - 1, msg.sender, endTime_, targetPrice_);
        return markets.length - 1;
    }

    /// @dev places a bet on a market. A user can place multiple bets in either direction on the same market.
    /// A user cannot revoke a bet.
    function placeBet(uint256 marketId_, uint256 amount_, BetDirection direction_) public {
        require(marketId_ < markets.length, "BetRegistry::placeBet: marketId out of range.");
        require(amount_ >= MIN_BID, "BetRegistry::placeBet: amount must be at least MIN_BID.");
        Market storage market = markets[marketId_];
        require(block.timestamp < market.endTime, "BetRegistry::placeBet: market has ended.");

        degenToken.safeTransferFrom(msg.sender, address(this), amount_);

        // deposit to steakedDegen
        degenToken.approve(address(steakedDegen), amount_);
        uint256 steaks = steakedDegen.deposit(amount_, address(this));

        // pay fee to totalSteakedDegen in Market. First bet does not pay fees.
        uint256 feeSteaks = market.totalSteakedDegen == 0 ? 0 : steaks.mulDiv(MARKET_FEE, FEE_DIVISOR);
        market.totalSteakedDegen += feeSteaks;
        steaks -= feeSteaks;

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

        emit BetPlaced({
            marketId: marketId_,
            user: msg.sender,
            degen: amount_,
            steaks: steaks,
            feeSteaks: feeSteaks,
            betShares: betShares,
            direction: direction_
        });
    }

    /// @dev resolves a market by fetching the price from the price feed.
    /// As prices are fetched by the uniswap v3 oracle, this function may fail if the market is resolved too late.
    /// A market should be resolved within a few hours.
    function resolveMarket(uint256 marketId_) public {
        Market storage market = markets[marketId_];
        require(block.timestamp >= market.endTime, "BetRegistry::resolveMarket: market has not ended.");
        require(block.timestamp >= market.endTime + gracePeriod, "BetRegistry::resolveMarket: grace period not over.");
        require(market.status == MarketStatus.OPEN, "BetRegistry::resolveMarket: market already resolved.");

        uint32 secondsAgo = uint32(block.timestamp - market.endTime);
        // Try to get a historical price from the price feed
        // This may fail if the market gets resolved too late. In this case, the market will be marked as error and all
        // users can get their funds back.
        try priceFeed.getPrice(secondsAgo) returns (uint256 price) {
            market.endPrice = price;
            market.status = MarketStatus.RESOLVED;
        } catch {
            market.status = MarketStatus.ERROR;
        }

        // unsteake degen
        uint256 degen = steakedDegen.redeem(market.totalSteakedDegen, address(this), address(this));
        uint256 creatorFee;

        // deduct creator fee when market got resolved successfully
        if (market.status == MarketStatus.RESOLVED) {
            creatorFee = degen.mulDiv(CREATOR_FEE, FEE_DIVISOR);
            market.totalDegen = degen - creatorFee;
            degenToken.safeTransfer(market.creator, creatorFee);
        } else {
            market.totalDegen = degen;
        }

        emit MarketResolved({
            marketId: marketId_,
            endPrice: market.endPrice,
            totalDegen: market.totalDegen,
            creatorFee: creatorFee,
            status: market.status
        });
    }

    /// @dev users can cash out their shares after a market has been resolved.
    /// Usually, one side of the market wins all other funds of the other side.
    /// If the market is in error state, users can cash out all their shares, minus the already paid fees.
    function cashOut(uint256 marketId_) public {
        Market storage market = markets[marketId_];
        require(market.status != MarketStatus.OPEN, "BetRegistry::cashOut: market not resolved.");
        require(market.totalDegen > 0, "BetRegistry::cashOut: market has no degen.");

        uint256 totalMarketShares;
        uint256 userMarketShares;
        uint256 userDegenPayout;

        // if the market is in error state, users can cash out all their shares, nobody looses
        if (market.status == MarketStatus.ERROR) {
            totalMarketShares = market.totalHigher + market.totalLower;
            userMarketShares = marketToUserToBet[marketId_][msg.sender].amountHigher
                + marketToUserToBet[marketId_][msg.sender].amountLower;
            require(userMarketShares > 0, "BetRegistry::cashOut: Nothing to cash out.");

            userDegenPayout = market.totalDegen.mulDiv(userMarketShares, totalMarketShares);

            market.totalHigher -= marketToUserToBet[marketId_][msg.sender].amountHigher;
            market.totalLower -= marketToUserToBet[marketId_][msg.sender].amountLower;
            market.totalDegen -= userDegenPayout;
            marketToUserToBet[marketId_][msg.sender].amountHigher = 0;
            marketToUserToBet[marketId_][msg.sender].amountLower = 0;
        } else if (market.status == MarketStatus.RESOLVED) {
            // When the market got resolved correctly, the winning side receives all shares
            if (market.endPrice > market.targetPrice) {
                // winning direction is HIGHER
                totalMarketShares = market.totalHigher;
                userMarketShares = marketToUserToBet[marketId_][msg.sender].amountHigher;
                require(userMarketShares > 0, "BetRegistry::cashOut: Nothing to cash out.");
                userDegenPayout = market.totalDegen.mulDiv(userMarketShares, totalMarketShares);
                marketToUserToBet[marketId_][msg.sender].amountHigher = 0;
                market.totalHigher -= userMarketShares;
                market.totalDegen -= userDegenPayout;
            } else {
                // winning direction is LOWER (even when price is exactly the target price, LOWER wins, per definition)
                totalMarketShares = market.totalLower;
                userMarketShares = marketToUserToBet[marketId_][msg.sender].amountLower;
                require(userMarketShares > 0, "BetRegistry::cashOut: Nothing to cash out.");
                userDegenPayout = market.totalDegen.mulDiv(userMarketShares, totalMarketShares);
                marketToUserToBet[marketId_][msg.sender].amountLower = 0;
                market.totalLower -= userMarketShares;
                market.totalDegen -= userDegenPayout;
            }
        }

        degenToken.safeTransfer(msg.sender, userDegenPayout);

        emit BetCashedOut({
            marketId: marketId_,
            user: msg.sender,
            degen: userDegenPayout,
            marketShares: userMarketShares
        });
    }

    /// @dev slash unclaimed funds after the grace period and the slash period have passed.
    /// This function makes sure, there are no locked funds in the smart contract.
    function slash(uint256 marketId_) public {
        Market storage market = markets[marketId_];
        require(
            block.timestamp >= market.endTime + gracePeriod + slashPeriod, "BetRegistry::slash: Slash period not over."
        );

        uint256 totalDegen = market.totalDegen;
        require(totalDegen > 0, "BetRegistry::slash: Nothing to slash.");
        market.totalDegen = 0;
        market.totalHigher = 0;
        market.totalLower = 0;

        // distribute fees (creator, slasher, dao, all receive the same amount)
        uint256 creatorFee = totalDegen.mulDiv(CREATOR_FEE, FEE_DIVISOR);
        uint256 slashFee = totalDegen.mulDiv(CREATOR_FEE, FEE_DIVISOR);
        uint256 daoFee = totalDegen.mulDiv(CREATOR_FEE, FEE_DIVISOR);

        totalDegen -= creatorFee + slashFee + daoFee;

        degenToken.safeTransfer(address(steakedDegen), totalDegen);
        degenToken.safeTransfer(market.creator, creatorFee);
        degenToken.safeTransfer(msg.sender, slashFee);
        degenToken.safeTransfer(degenUtilityDao, daoFee);

        emit MarketSlashed({
            marketId: marketId_,
            totalDegen: totalDegen,
            creatorFee: creatorFee,
            slashFee: slashFee,
            daoFee: daoFee,
            slasher: msg.sender
        });
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
}
