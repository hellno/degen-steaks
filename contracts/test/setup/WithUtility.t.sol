// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import "test/setup/Constants.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import {FaucetToken} from "src/auxiliary/FaucetToken.sol";

contract WithUtility is Test {
    IBetRegistry betRegistry;
    FaucetToken faucetToken;

    /// @dev This function removes this contract from coverage reports
    function test_WithUtility() public {}

    function deploy() public {
        faucetToken = new FaucetToken("Degen Token", "DEGEN");
        betRegistry = new BetRegistry(address(faucetToken));
    }

    function _createMarket(uint40 endTime, uint256 targetPrice) public {
        betRegistry.createMarket(endTime, targetPrice);
    }

    function _getMarket(uint256 marketId) public view returns (IBetRegistry.Market memory) {
        return betRegistry.getMarket(marketId);
    }

    function _dealAndApprove(address account, uint256 amount) public {
        deal(address(faucetToken), account, amount);
        faucetToken.approve(address(betRegistry), amount);
    }

    function _placeBet(uint256 marketId, uint256 amountHigher, uint256 amountLower) public {
        _dealAndApprove(address(this), amountHigher + amountLower);
        betRegistry.placeBet(marketId, amountHigher, amountLower);
    }

    function _getBet(uint256 marketId, address user) public view returns (IBetRegistry.Bet memory) {
        return betRegistry.getBet(marketId, user);
    }
}
