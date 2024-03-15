#!/bin/bash

# To load the variables in the .env file
source .env

# Set balance of deployer to 1 ETH
cast rpc anvil_setBalance 0x124f4FBB2a51f363c69078aDF24E1C387D445C0E 1000000000000000000
cast rpc anvil_setBalance 0x42A1EeeAFf98C2C713c5Bf253057564E5a171306 1000000000000000000
cast rpc anvil_setBalance 0x3E8C992a2e94280be9f2b942Bfcc3e2a7cc30e71 1000000000000000000

# To deploy and verify our contract
forge script script/TractionTestnetToLocal.s.sol --fork-url http://localhost:8545 --broadcast -vvvv --legacy
