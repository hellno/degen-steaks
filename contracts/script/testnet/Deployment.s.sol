// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithActionHelpers.s.sol";

contract TestnetDeployment is Script, WithActionHelpers {
    function run() public {
        setNetwork(vm.envOr("NETWORK", string("testrun")));

        deployTestnet();
    }

    function test_script() public {}
}
