// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "script/TractionTestnet.s.sol";

contract TractionTestnetToLocal is Script, WithFileHelpers {
    function run() public {
        setNetwork("local");

        TractionTestnet tractionTestnet = new TractionTestnet();
        tractionTestnet.setNetwork(_network);
        tractionTestnet.traction();
    }
}
