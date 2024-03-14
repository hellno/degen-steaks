// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "src/BetRegistry.sol";
import "src/auxiliary/MockPriceFeed.sol";
import "src/SteakedDegen.sol";
import "src/auxiliary/DegenToken.sol";

contract DeployTestnet is Script, WithFileHelpers {
    IBetRegistry betRegistry;
    DegenToken degenToken;
    ISteakedDegen steakedDegen;
    MockPriceFeed priceFeed;

    function deploy() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PK");
        vm.startBroadcast(deployerPrivateKey);

        priceFeed = new MockPriceFeed();
        degenToken = new DegenToken("Degen Token", "DEGEN");
        steakedDegen = new SteakedDegen("Steaked Degen", "SDEGEN", degenToken, address(this));
        betRegistry = new BetRegistry(degenToken, steakedDegen, IPriceFeed(address(priceFeed)), address(this));
        steakedDegen.setFan(address(betRegistry), true);

        uint256 initialDeposit = 10 * 1e6 * 1e18;
        degenToken.mint(initialDeposit);
        degenToken.approve(address(steakedDegen), initialDeposit);
        steakedDegen.initialDeposit(initialDeposit, address(this));

        // Write Files

        _writeJson("priceFeed", address(priceFeed));
        _writeJson("degenToken", address(degenToken));
        _writeJson("steakedDegen", address(steakedDegen));
        _writeJson("betRegistry", address(betRegistry));

        string memory addressFile = string.concat("deployments/", _network, "_addresses.ts");

        string memory addresses = string(
            abi.encodePacked(
                "export const priceFeedAddress = \"",
                vm.toString(address(priceFeed)),
                "\";\n",
                "export const degenTokenAddress = \"",
                vm.toString(address(degenToken)),
                "\";\n",
                "export const steakedDegenAddress = \"",
                vm.toString(address(steakedDegen)),
                "\";\n",
                "export const betRegistryAddress = \"",
                vm.toString(address(betRegistry)),
                "\";\n"
            )
        );
        vm.writeFile(addressFile, addresses);
    }
}
