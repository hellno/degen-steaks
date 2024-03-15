#!/bin/bash

# To load the variables in the .env file
source .env

# Set balances to 1 ETH
cast rpc anvil_setBalance 0x00590BB9a26AFCABfF0311E937DD72066B4fFC38 1000000000000000000
cast rpc anvil_setBalance 0x124f4FBB2a51f363c69078aDF24E1C387D445C0E 1000000000000000000
cast rpc anvil_setBalance 0x42A1EeeAFf98C2C713c5Bf253057564E5a171306 1000000000000000000
cast rpc anvil_setBalance 0x3E8C992a2e94280be9f2b942Bfcc3e2a7cc30e71 1000000000000000000

# To deploy and verify our contract
NETWORK=local forge script script/testnet/Deployment.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
NETWORK=local STEP=1 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
echo "start sleep"
sleep 60
echo "end sleep"
NETWORK=local STEP=2 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
NETWORK=local STEP=3 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
NETWORK=local STEP=4 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
NETWORK=local STEP=5 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
echo "start sleep"
sleep 60
echo "end sleep"
NETWORK=local STEP=6 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
NETWORK=local STEP=7 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv --legacy 
