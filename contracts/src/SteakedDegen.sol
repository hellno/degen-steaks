// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./interfaces/IBetRegistry.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin/token/ERC20/extensions/ERC4626.sol";

contract SteakedDegen is ERC4626 {
    using SafeERC20 for IERC20;

    constructor(string memory name_, string memory symbol_, IERC20 degenToken_)
        ERC20(name_, symbol_)
        ERC4626(degenToken_)
    {}
}
