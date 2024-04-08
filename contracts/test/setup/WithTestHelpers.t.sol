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
    event MarketResolved(
        uint256 indexed marketId,
        uint256 endPrice,
        uint256 totalDegen,
        uint256 creatorFee,
        IBetRegistry.MarketStatus status
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
    event SteakFeePaid(address indexed caller, uint256 amount);
    event DaoFeePaid(address indexed caller, uint256 amount);
    event FanSet(address indexed user, bool isFan);
    event InitialDeposit(address indexed sender, address indexed receiver, uint256 assets, uint256 shares);
    event GracePeriodSet(uint256 gracePeriod);
    event SlashPeriodSet(uint256 slashPeriod);

    IBetRegistry betRegistry;
    IERC20 degenToken;
    ISteakedDegen steakedDegen;
    EthDegenPool ethDegenPool;
    EthUsdcPool ethUsdcPool;
    IPriceFeed priceFeed;

    /// @dev This function removes this contract from coverage reports
    function test_WithTestHelpers() public {}

    function deploy() public {
        ethDegenPool = new EthDegenPool();
        ethUsdcPool = new EthUsdcPool();
        priceFeed = new PriceFeed(address(ethDegenPool), address(ethUsdcPool));

        degenToken = new DegenToken("Degen Token", "DEGEN");
        steakedDegen = new SteakedDegen("Steaked Degen", "SDEGEN", degenToken, DEGEN_UTILITY_DAO);
        betRegistry = new BetRegistry(degenToken, steakedDegen, priceFeed, DEGEN_UTILITY_DAO);
        steakedDegen.setFan(address(betRegistry), true);

        _initialDeposit(INITIAL_STAKE, DEGEN_UTILITY_DAO);
    }

    function deployWithoutInitialDeposit() public {
        degenToken = new DegenToken("Degen Token", "DEGEN");
        steakedDegen = new SteakedDegen("Steaked Degen", "SDEGEN", degenToken, DEGEN_UTILITY_DAO);
        betRegistry = new BetRegistry(degenToken, steakedDegen, priceFeed, DEGEN_UTILITY_DAO);
    }

    function _createMarket(uint40 endTime, uint256 targetPrice) public returns (uint256) {
        return betRegistry.createMarket(endTime, targetPrice);
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
        _dealAndApprove(ALICE, amount);
        vm.prank(ALICE);
        betRegistry.placeBet(marketId, amount, direction);
    }

    function _getBet(uint256 marketId, address user) public view returns (IBetRegistry.Bet memory) {
        return betRegistry.getBet(marketId, user);
    }

    function _cashOut(uint256 marketId) public {
        vm.prank(ALICE);
        betRegistry.cashOut(marketId);
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
