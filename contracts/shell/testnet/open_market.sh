#!/bin/bash

# To load the variables in the .env file
source .env


# To deploy and verify our contract
END_TIME=1710867952 TARGET_PRICE=3468565538 NETWORK=testnet forge script script/testnet/OpenMarket.s.sol --fork-url https://sepolia.base.org --broadcast -vvvv --legacy --private-key $DEPLOYER_PK
