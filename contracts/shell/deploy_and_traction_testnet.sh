#!/bin/bash

# To load the variables in the .env file
source .env

# To deploy and verify our contract
NETWORK=testnet forge script script/testnet/Deployment.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv 
NETWORK=testnet STEP=1 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv --legacy 
echo "start sleep"
sleep 90
echo "end sleep"
NETWORK=testnet STEP=2 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv --legacy 
NETWORK=testnet STEP=3 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv --legacy 
NETWORK=testnet STEP=4 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv --legacy 
NETWORK=testnet STEP=5 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv --legacy 
echo "start sleep"
sleep 90
echo "end sleep"
NETWORK=testnet STEP=6 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv --legacy 
NETWORK=testnet STEP=7 MARKET_DURATIONH=90 forge script script/testnet/Traction.s.sol --rpc-url https://sepolia.base.org --broadcast -vvvv --legacy 
