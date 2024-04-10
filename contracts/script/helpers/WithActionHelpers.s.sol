// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "script/helpers/WithFileHelpers.s.sol";
import "test/setup/Constants.t.sol";
import "src/BetRegistry.sol";
import "src/SteakedDegen.sol";
import "src/PriceFeed.sol";
import "src/auxiliary/DegenToken.sol";
import "src/auxiliary/MockPriceFeed.sol";

/// @dev holds action like deploying the system and creating some traction for testnet
contract WithActionHelpers is Script, WithFileHelpers {
    IBetRegistry betRegistry;
    DegenToken degenToken;
    ISteakedDegen steakedDegen;
    IPriceFeed priceFeed;
    uint256 betAmount;
    uint256 marketDuration = 35; // the script will sleep for this duration

    /// @dev testnet deployment with MockDEGEN and MockPriceFeed
    function deployTestnet() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PK");
        vm.startBroadcast(deployerPrivateKey);

        priceFeed = IPriceFeed(address(new MockPriceFeed()));
        degenToken = new DegenToken("Degen Token", "DEGEN");
        steakedDegen = new SteakedDegen("Steaked Degen", unicode"🥩🎩", degenToken, address(this));
        betRegistry = new BetRegistry(degenToken, steakedDegen, priceFeed, address(this));
        steakedDegen.setFan(address(betRegistry), true);

        uint256 initialDeposit = 10 * 1e6 * 1e18;
        degenToken.mint(initialDeposit);
        degenToken.approve(address(steakedDegen), initialDeposit);
        steakedDegen.initialDeposit(initialDeposit, address(this));

        vm.stopBroadcast();

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

    /// @dev
    function deployBaseMainnet() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PK");

        address ethDegenPool = 0xc9034c3E7F58003E6ae0C8438e7c8f4598d5ACAA;
        address ethUsdcPool = 0x4C36388bE6F416A29C8d8Eee81C771cE6bE14B18;
        address degenTokenAddress = 0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed;

        address dude = 0x2887e0d5a6D4869BE9589a5ea5693008FC168631;
        address hellno = 0x36E31d250686E9B700c8A2a08E98458004E4D988;

        vm.startBroadcast(deployerPrivateKey);

        priceFeed = new PriceFeed({ethDegenPool_: ethDegenPool, ethUsdcPool_: ethUsdcPool});
        degenToken = DegenToken(degenTokenAddress);
        steakedDegen = new SteakedDegen("Steaked Degen", unicode"🥩🎩", degenToken, dude);
        betRegistry = new BetRegistry(degenToken, steakedDegen, IPriceFeed(address(priceFeed)), dude);
        steakedDegen.setFan(address(betRegistry), true);
        betRegistry.setFan(hellno, true);

        uint256 initialDeposit = 420 * 1e18;
        degenToken.approve(address(steakedDegen), initialDeposit);
        steakedDegen.initialDeposit(initialDeposit, address(this));

        vm.stopBroadcast();

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

    /// @dev open and close several markets and bets
    /// the actions are separated into different functions that need 10 seconds of time in between them on testnet
    /// locally the time difference can be simulated
    function traction() public {
        traction_setup();
        traction_1();

        sleep(marketDuration);

        traction_2();
        traction_3();
        traction_4();
        traction_5();

        sleep(marketDuration);

        traction_6();
        traction_7();
    }

    function sleep(uint256 seconds_) public {
        if (keccak256(abi.encodePacked(_network)) == keccak256(abi.encodePacked("local"))) {
            vm.warp(block.timestamp + seconds_);
        } else if (keccak256(abi.encodePacked(_network)) == keccak256(abi.encodePacked("testnet"))) {
            vm.sleep(seconds_ * 1_000);
        } else if (keccak256(abi.encodePacked(_network)) == keccak256(abi.encodePacked("testrun"))) {
            vm.warp(block.timestamp + seconds_);
        } else {
            revert("unsupported network");
        }
    }

    function traction_setup() public {
        betRegistry = IBetRegistry(_getAddress("betRegistry"));
        degenToken = DegenToken(_getAddress("degenToken"));
        priceFeed = IPriceFeed(_getAddress("priceFeed"));
        betAmount = 1e6 * 1e18;

        marketDuration = vm.envOr("MARKET_DURATION", uint256(35));
    }

    function traction_1() public {
        // Set grace and slash period to 0
        // create a market
        vm.startBroadcast(vm.envUint("DEPLOYER_PK"));
        betRegistry.setGracePeriod(0);
        betRegistry.setSlashPeriod(0);
        betRegistry.createMarket(uint40(block.timestamp + marketDuration), DEGEN_PRICE_1 - 1);
        vm.stopBroadcast();

        // Place bets
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        degenToken.mint(betAmount);
        degenToken.approve(address(betRegistry), betAmount);
        betRegistry.placeBet(0, betAmount, IBetRegistry.BetDirection.HIGHER);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("BOB_PK"));
        degenToken.mint(betAmount);
        degenToken.approve(address(betRegistry), betAmount);
        betRegistry.placeBet(0, betAmount, IBetRegistry.BetDirection.LOWER);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("CAROL_PK"));
        degenToken.mint(betAmount);
        degenToken.approve(address(betRegistry), betAmount);
        betRegistry.placeBet(0, betAmount, IBetRegistry.BetDirection.HIGHER);
        vm.stopBroadcast();
    }

    function traction_2() public {
        // Resolve the market
        // HIGHER wins
        vm.startBroadcast(vm.envUint("DEPLOYER_PK"));
        MockPriceFeed(address(priceFeed)).setPrice(DEGEN_PRICE_1);
        betRegistry.resolveMarket(0);
        vm.stopBroadcast();
    }

    function traction_3() public {
        // Cash out Alice
        // (Bob lost his bet)
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        betRegistry.cashOut(0);
        vm.stopBroadcast();
    }

    function traction_4() public {
        // Simulate slash
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        betRegistry.slash(0);
        vm.stopBroadcast();

        // Create two new markets with different end times
        // 1 will stay open, 2 will close earlier
        vm.startBroadcast(vm.envUint("DEPLOYER_PK"));
        betRegistry.createMarket(uint40(block.timestamp + 1 days), DEGEN_PRICE_1 - 1);
        betRegistry.createMarket(uint40(block.timestamp + marketDuration), DEGEN_PRICE_1 + 1);
        vm.stopBroadcast();
    }

    function traction_5() public {
        // Place bets
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        degenToken.mint(betAmount * 2);
        degenToken.approve(address(betRegistry), betAmount * 2);
        betRegistry.placeBet(1, betAmount, IBetRegistry.BetDirection.HIGHER);
        betRegistry.placeBet(2, betAmount, IBetRegistry.BetDirection.LOWER);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("BOB_PK"));
        degenToken.mint(betAmount * 2);
        degenToken.approve(address(betRegistry), betAmount * 2);
        betRegistry.placeBet(1, betAmount, IBetRegistry.BetDirection.LOWER);
        betRegistry.placeBet(2, betAmount, IBetRegistry.BetDirection.HIGHER);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("CAROL_PK"));
        degenToken.mint(betAmount * 2);
        degenToken.approve(address(betRegistry), betAmount * 2);
        betRegistry.placeBet(1, betAmount, IBetRegistry.BetDirection.HIGHER);
        betRegistry.placeBet(2, betAmount, IBetRegistry.BetDirection.LOWER);
        vm.stopBroadcast();
    }

    function traction_6() public {
        vm.startBroadcast(vm.envUint("DEPLOYER_PK"));
        betRegistry.resolveMarket(2);
        vm.stopBroadcast();
    }

    function traction_7() public {
        // Cash out
        vm.startBroadcast(vm.envUint("ALICE_PK"));
        betRegistry.cashOut(2);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("CAROL_PK"));
        betRegistry.cashOut(2);
        vm.stopBroadcast();
    }

    function traction_openMarket() public {
        uint256 endTime = vm.envOr("END_TIME", uint256(block.timestamp + 1 hours));
        uint256 targetPrice = vm.envOr("TARGET_PRICE", DEGEN_PRICE_1);

        vm.startBroadcast();
        betRegistry.createMarket(uint40(endTime), targetPrice);
        vm.stopBroadcast();
    }

    function traction_setPrice() public {
        uint256 price = vm.envUint("PRICE");

        vm.startBroadcast();
        MockPriceFeed(address(priceFeed)).setPrice(price);
        vm.stopBroadcast();
    }

    function traction_resolveMarket() public {
        uint256 marketId = vm.envUint("MARKET_ID");

        vm.startBroadcast();
        betRegistry.resolveMarket(marketId);
        vm.stopBroadcast();
    }

    function test_WithActionHelpers() public {}

    /// @dev
    function deployPriceFeedOnly() public {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PK");

        address ethDegenPool = 0xc9034c3E7F58003E6ae0C8438e7c8f4598d5ACAA;
        address ethUsdcPool = 0x4C36388bE6F416A29C8d8Eee81C771cE6bE14B18;

        vm.startBroadcast(deployerPrivateKey);

        priceFeed = new PriceFeed({ethDegenPool_: ethDegenPool, ethUsdcPool_: ethUsdcPool});

        vm.stopBroadcast();
    }
}
