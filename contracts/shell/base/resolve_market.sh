#!/bin/bash

# To load the variables in the .env file
source .env


# To deploy and verify our contract
MARKET_ID=1 NETWORK=base forge script script/base/ResolveMarket.s.sol --fork-url https://mainnet.base.org --broadcast -vvvv --legacy --private-key $DEPLOYER_PK
