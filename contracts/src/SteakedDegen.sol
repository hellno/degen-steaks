// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./interfaces/IBetRegistry.sol";
import "./interfaces/ISteakedDegen.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin/token/ERC20/extensions/ERC4626.sol";
import "openzeppelin/access/Ownable.sol";

contract SteakedDegen is ISteakedDegen, ERC4626, Ownable {
    using SafeERC20 for IERC20;

    uint256 steakFee = 69 * 1e2; // 0.69%
    uint256 constant FEE_DIVISOR = 1e6; // 1% = 1e4: 1 BPS = 1e2

    event SteakFeePaid(address indexed caller, uint256 amount);

    mapping(address => bool) public isFan; // haha just kidding, it's a pun. onlyDepositer is a better name.

    constructor(string memory name_, string memory symbol_, IERC20 degenToken_)
        ERC20(name_, symbol_)
        ERC4626(degenToken_)
        Ownable(_msgSender())
    {}

    modifier onlyFans() {
        require(isFan[_msgSender()], "SteakedDegen::onlyFans: caller is not a fan.");
        _;
    }

    function setFan(address fan_, bool isFan_) public onlyOwner {
        isFan[fan_] = isFan_;
    }

    /**
     * @dev See {IERC4626-deposit}.
     * This is a complete override of deposit and _deposit.
     * A steak fee is taken _before_ the deposit to be paid to all other token holders.
     * The fee increases the totalAssets in the pool. This increases the price for all share token holders.
     */
    function deposit(uint256 assets, address receiver) public override(ERC4626, IERC4626) onlyFans returns (uint256) {
        uint256 maxAssets = maxDeposit(receiver);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxDeposit(receiver, assets, maxAssets);
        }

        uint256 feeAmount = steakFee * assets / FEE_DIVISOR;
        uint256 assetsAfterFee = assets - feeAmount;
        uint256 shares = previewDeposit(assetsAfterFee);

        // slither-disable-next-line reentrancy-no-eth
        SafeERC20.safeTransferFrom(IERC20(asset()), _msgSender(), address(this), assets);
        emit SteakFeePaid(_msgSender(), feeAmount);
        _mint(receiver, shares);

        emit Deposit(_msgSender(), receiver, assetsAfterFee, shares);

        return shares;
    }
}
