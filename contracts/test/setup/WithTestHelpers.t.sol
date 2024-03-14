// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import "test/setup/Constants.t.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";
import {DegenToken} from "src/auxiliary/DegenToken.sol";
import {SteakedDegen} from "src/SteakedDegen.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "src/interfaces/ISteakedDegen.sol";
import "src/auxiliary/EthDegenPool.sol";
import "src/auxiliary/EthUsdcPool.sol";
import "src/PriceFeed.sol";

contract WithTestHelpers is Test {
    IBetRegistry betRegistry;
    IERC20 degenToken;
    ISteakedDegen steakedDegen;
    EthDegenPool ethDegenPool;
    EthUsdcPool ethUsdcPool;
    PriceFeed priceFeed;

    /// @dev This function removes this contract from coverage reports
    function test_WithTestHelpers() public {}

    function deploy() public {
        degenToken = new DegenToken("Degen Token", "DEGEN");
        steakedDegen = new SteakedDegen("Steaked Degen", "SDEGEN", degenToken, DEGEN_UTILITY_DAO);
        betRegistry = new BetRegistry(degenToken, steakedDegen, DEGEN_UTILITY_DAO);
        steakedDegen.setFan(address(betRegistry), true);

        ethDegenPool = new EthDegenPool();
        ethUsdcPool = new EthUsdcPool();
        priceFeed = new PriceFeed(address(ethDegenPool), address(ethUsdcPool));

        _initialDeposit(INITIAL_STAKE, DEGEN_UTILITY_DAO);
    }

    function deployWithoutInitialDeposit() public {
        degenToken = new DegenToken("Degen Token", "DEGEN");
        steakedDegen = new SteakedDegen("Steaked Degen", "SDEGEN", degenToken, DEGEN_UTILITY_DAO);
        betRegistry = new BetRegistry(degenToken, steakedDegen, DEGEN_UTILITY_DAO);
    }

    function _createMarket(uint40 endTime, uint256 targetPrice) public {
        betRegistry.createMarket(endTime, targetPrice);
    }

    function _getMarket(uint256 marketId) public view returns (IBetRegistry.Market memory) {
        return betRegistry.getMarket(marketId);
    }

    function _dealAndApprove(address account, address receiver, uint256 amount) public {
        deal(address(degenToken), account, amount);
        vm.prank(account);
        degenToken.approve(receiver, amount);
    }

    function _dealAndApprove(address account, uint256 amount) public {
        deal(address(degenToken), account, amount);
        vm.prank(account);
        degenToken.approve(address(betRegistry), amount);
    }

    function _placeBet(uint256 marketId, uint256 amount, IBetRegistry.BetDirection direction) public {
        _dealAndApprove(address(this), amount);
        betRegistry.placeBet(marketId, amount, direction);
    }

    function _getBet(uint256 marketId, address user) public view returns (IBetRegistry.Bet memory) {
        return betRegistry.getBet(marketId, user);
    }

    function _deposit(address account, uint256 amount) public {
        steakedDegen.setFan(account, true);
        _dealAndApprove(account, address(steakedDegen), amount);
        vm.prank(account);
        steakedDegen.deposit(amount, account);
    }

    function _initialDeposit(uint256 amount, address receiver) public {
        steakedDegen.setFan(address(this), true);
        _dealAndApprove(address(this), address(steakedDegen), amount);
        vm.prank(address(this));
        steakedDegen.initialDeposit(amount, receiver);
    }

    function _withdraw(address account, uint256 amount) public {
        vm.prank(account);
        steakedDegen.withdraw(amount, account, account);
    }

    function _redeem(address account, uint256 amount) public {
        vm.prank(account);
        steakedDegen.redeem(amount, account, account);
    }
}