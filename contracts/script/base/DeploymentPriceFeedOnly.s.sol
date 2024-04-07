// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithActionHelpers.s.sol";

contract BaseDeploymentPriceFeedOnly is Script, WithActionHelpers {
    function run() public {
        setNetwork(vm.envOr("NETWORK", string("testrun_base")));

        deployPriceFeedOnly();
    }

    function test_script() public {}
}
