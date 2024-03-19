// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Test, console2} from "forge-std/Test.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "script/base/Deployment.s.sol";

contract BaseDeployTest is WithFileHelpers, Test {
    uint256 fork;

    function setUp() public {
        string memory BASE_RPC_URL = vm.envOr("BASE_RPC_URL", string("https://mainnet.base.org"));
        uint256 BASE_BLOCK_NUMBER = vm.envOr("BASE_BLOCK_NUMBER", uint256(12037278));
        fork = vm.createFork(BASE_RPC_URL);
        vm.selectFork(fork);
        vm.rollFork(BASE_BLOCK_NUMBER);

        address degenTokenAddress = 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed;
        address degenWhale = 0x704Ec5C12Ca20a293C2C0B72B22619A4231f3c0d;

        vm.prank(degenWhale);
        IERC20(degenTokenAddress).transfer(vm.envAddress("DEPLOYER"), 1_000_000 * 1e18);

        setNetwork("testrun_base");
        BaseDeployment baseDeployment = new BaseDeployment();
        baseDeployment.setNetwork("testrun_base");
        baseDeployment.run();
    }

    function test_BaseDeployment_success() public {
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
