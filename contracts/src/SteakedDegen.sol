// SPDX-License-Identifier: BUSL 1.1
pragma solidity ^0.8.18;

import "./interfaces/IBetRegistry.sol";
import "./interfaces/ISteakedDegen.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin/token/ERC20/extensions/ERC4626.sol";
import "openzeppelin/access/Ownable2Step.sol";

contract SteakedDegen is ISteakedDegen, ERC4626, Ownable2Step {
    using SafeERC20 for IERC20;

    uint256 public steakFee = 69 * 1e2; // 0.69%
    uint256 public daoFee = 69 * 1e2; // 0.69%
    uint256 constant FEE_DIVISOR = 1e6; // 1% = 1e4: 1 BPS = 1e2

    address daoFeeReceiver;

    bool isInitialized = false;

    mapping(address => bool) public isFan; // haha just kidding, it's a pun. onlyDepositer would be a better name.

    constructor(string memory name_, string memory symbol_, IERC20 degenToken_, address daoFeeReceiver_)
        ERC20(name_, symbol_)
        ERC4626(degenToken_)
        Ownable(_msgSender())
    {
        daoFeeReceiver = daoFeeReceiver_;
    }

    modifier onlyFans() {
        require(isFan[_msgSender()], "SteakedDegen::onlyFans: caller is not a fan.");
        _;
    }

    modifier whenInitialized() {
        require(isInitialized, "SteakedDegen::whenInitialized: not initialized.");
        _;
    }

    function setFan(address fan_, bool isFan_) public onlyOwner {
        isFan[fan_] = isFan_;
        emit FanSet(fan_, isFan_);
    }

    /**
     * @dev The initial deposit is needed to initialize the ratio. No fee applies here.
     */
    function initialDeposit(uint256 assets_, address receiver_) public onlyOwner {
        require(!isInitialized, "SteakedDegen::initialDeposit: already initialized.");
        isInitialized = true;

        uint256 shares = previewDeposit(assets_);

        _deposit(_msgSender(), receiver_, assets_, shares);

        emit InitialDeposit(_msgSender(), receiver_, assets_, shares);
    }

    /**
     * @dev See {IERC4626-deposit}. But this deposit function does NOT comply with the ERC4626 standard.
     * This is a complete override of deposit and _deposit.
     * A steak fee is taken _before_ the deposit to be paid to all other token holders.
     * The fee increases the totalAssets in the pool. This increases the price for all share token holders.
     * A deposit can only be made by authorized actors (fans).
     */
    function deposit(uint256 assets, address receiver)
        public
        override(ERC4626, IERC4626)
        onlyFans
        whenInitialized
        returns (uint256)
    {
        uint256 steakFeeAmount = steakFee * assets / FEE_DIVISOR;
        uint256 assetsAfterFee = assets - steakFeeAmount;

        // // slither-disable-next-line reentrancy-no-eth
        // SafeERC20.safeTransferFrom(IERC20(asset()), _msgSender(), daoFeeReceiver, daoFeeAmount);

        // slither-disable-next-line reentrancy-no-eth
        SafeERC20.safeTransferFrom(IERC20(asset()), _msgSender(), address(this), steakFeeAmount);
        emit SteakFeePaid(_msgSender(), steakFeeAmount);

        uint256 shares = previewDeposit(assetsAfterFee);
        uint256 daoFeeShares = daoFee * shares / FEE_DIVISOR;
        uint256 sharesAfterFee = shares - daoFeeShares;

        // slither-disable-next-line reentrancy-no-eth
        SafeERC20.safeTransferFrom(IERC20(asset()), _msgSender(), address(this), assetsAfterFee);

        _mint(receiver, sharesAfterFee);
        emit Deposit(_msgSender(), receiver, assetsAfterFee, sharesAfterFee);

        _mint(daoFeeReceiver, daoFeeShares);
        emit DaoFeePaid(_msgSender(), daoFeeShares);

        return sharesAfterFee;
    }
}
