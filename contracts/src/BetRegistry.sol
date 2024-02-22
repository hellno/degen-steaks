// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./interfaces/IBetRegistry.sol";

contract BetRegistry is IBetRegistry {
    Market[] public markets;
    mapping(uint256 marketId => mapping(address user => Bet)) public marketToUserToBet;

    function getMarket(uint256 marketId_) public view returns (Market memory) {
        if (marketId_ >= markets.length) {
            revert("BetRegistry::getMarket marketId out of range");
        }
        return markets[marketId_];
    }

    function createMarket(uint40 endTime_, uint256 targetPrice_) public {
        markets.push(
            Market({creator: msg.sender, endTime: endTime_, targetPrice: targetPrice_, totalHigher: 0, totalLower: 0})
        );

        emit MarketCreated(markets.length - 1, msg.sender, endTime_, targetPrice_);
    }

    function placeBet(uint256 marketId_, uint256 amountHigher_, uint256 amountLower_) public {
        require(marketId_ < markets.length, "BetRegistry: marketId out of range");
        require(block.timestamp < markets[marketId_].endTime, "BetRegistry: market has ended");

        Bet storage bet = marketToUserToBet[marketId_][msg.sender];
        bet.amountHigher = amountHigher_;
        bet.amountLower = amountLower_;

        // @dev up only
        if (amountHigher_ > 0) {
            markets[marketId_].totalHigher += amountHigher_;
        }

        if (amountLower_ > 0) {
            markets[marketId_].totalLower += amountLower_;
        }
    }
}
