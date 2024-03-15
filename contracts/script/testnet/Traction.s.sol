// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithActionHelpers.s.sol";

contract TestnetTraction is Script, WithActionHelpers {
    function run() public {
        setNetwork(vm.envOr("NETWORK", string("testrun")));

        traction_setup();

        uint256 step = vm.envOr("STEP", uint256(1));

        if (step == 1) {
            traction_1();
        } else if (step == 2) {
            traction_2();
        } else if (step == 3) {
            traction_3();
        } else if (step == 4) {
            traction_4();
        } else if (step == 5) {
            traction_5();
        } else if (step == 6) {
            traction_6();
        } else if (step == 7) {
            traction_7();
        }
    }

    function test_script() public {}
}
