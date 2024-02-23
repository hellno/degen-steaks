// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "openzeppelin/interfaces/IERC4626.sol";

interface ISteakedDegen is IERC4626 {
    function setFan(address user, bool isFan) external;
    function isFan(address user) external view returns (bool);
}
