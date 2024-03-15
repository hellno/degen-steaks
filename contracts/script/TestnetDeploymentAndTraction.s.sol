// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithActionHelpers.s.sol";

contract TestnetDeploymentAndTraction is Script, WithActionHelpers {
    function run() public {
        // require _network to be set
        require(keccak256(abi.encodePacked(_network)) != keccak256(abi.encodePacked("")), "network not set");

        deployTestnet();
        traction();
    }

    function test_script() public {}
}
