// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Test, console2} from "forge-std/Test.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "script/TestnetDeploymentAndTraction.s.sol";

contract Test_DeploymentScripts is WithFileHelpers, Test {
    function test_TestnetDeploymentAndTraction_success() public {
        setNetwork("testrun");
        TestnetDeploymentAndTraction testnetDeploymentAndTraction = new TestnetDeploymentAndTraction();
        testnetDeploymentAndTraction.setNetwork("testrun");
        testnetDeploymentAndTraction.run();

        IBetRegistry betRegistry = IBetRegistry(_getAddress("betRegistry"));
        DegenToken degenToken = DegenToken(_getAddress("degenToken"));
        ISteakedDegen steakedDegen = ISteakedDegen(_getAddress("steakedDegen"));
        MockPriceFeed priceFeed = MockPriceFeed(_getAddress("priceFeed"));

        assertEq(address(betRegistry.degenToken()), address(degenToken), "betRegistry.degenToken");
        assertEq(address(betRegistry.steakedDegen()), address(steakedDegen), "betRegistry.steakedDegen");
        assertEq(address(betRegistry.priceFeed()), address(priceFeed), "betRegistry.priceFeed");
        assertEq(address(steakedDegen.asset()), address(degenToken), "steakedDegen.degenToken");
        assertTrue(steakedDegen.isFan(address(betRegistry)), "steakedDegen.isFan");
        assertTrue(betRegistry.isFan(vm.envAddress("DEPLOYER")), "betRegistry.isFan");
    }

    function test_TestnetDeploymentAndTraction_fail_networkNotSet() public {
        TestnetDeploymentAndTraction testnetDeploymentAndTraction = new TestnetDeploymentAndTraction();
        vm.expectRevert("network not set.");
        testnetDeploymentAndTraction.run();
    }
}
