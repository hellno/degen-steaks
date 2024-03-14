// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Test, console2} from "forge-std/Test.sol";
import "script/DeployTestnetToTest.s.sol";
import "script/helpers/WithFileHelpers.s.sol";

contract DeployTestnetToTest_Test is WithFileHelpers, Test {
    DeployTestnetToTest deployTestnetToTest;

    function setUp() public {
        setNetwork("testrun");
        deployTestnetToTest = new DeployTestnetToTest();
        deployTestnetToTest.run();
    }

    function test_deploymentAddresses() public {
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
}
