// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithActionHelpers.s.sol";
import "script/DeployTestnet.s.sol";
import "script/TractionTestnet.s.sol";

contract TestnetDeploymentAndTraction is Script, WithActionHelpers {
    function run() public {
        // require _network to be set
        require(keccak256(abi.encodePacked(_network)) != keccak256(abi.encodePacked("")), "network not set");

        DeployTestnet deployTestnet = new DeployTestnet();
        deployTestnet.setNetwork(_network);
        deployTestnet.deploy();

        TractionTestnet tractionTestnet = new TractionTestnet();
        tractionTestnet.setNetwork(_network);
        tractionTestnet.traction();
    }

    function test_script() public {}
}
