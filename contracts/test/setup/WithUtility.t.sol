// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {IBetRegistry, BetRegistry} from "src/BetRegistry.sol";

contract WithUtility is Test {
    IBetRegistry betRegistry;

    /// @dev This function removes this contract from coverage reports
    function test_WithUtility() public {}

    function deploy() public {
        betRegistry = new BetRegistry();
    }
}
