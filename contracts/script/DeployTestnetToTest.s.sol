// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "script/DeployTestnet.s.sol";

contract DeployTestnetToTest is Script, WithFileHelpers {
    function run() public {
        string memory _network = "testrun";
        setNetwork(_network);

        DeployTestnet deployTestnet = new DeployTestnet();
        deployTestnet.setNetwork(_network);
        deployTestnet.deploy();
    }
}
