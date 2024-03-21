#!/bin/bash

# To load the variables in the .env file
source .env


# To deploy and verify our contract
MARKET_ID=3 PRICE=3468565539 NETWORK=testnet forge script script/testnet/ResolveMarket.s.sol --fork-url https://sepolia.base.org --broadcast -vvvv --legacy --private-key $DEPLOYER_PK
