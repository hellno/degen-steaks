#!/bin/bash

# To load the variables in the .env file
source .env

# To deploy and verify our contract
NETWORK=base forge script script/base/DeploymentPriceFeedOnly.s.sol --rpc-url https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY --slow --legacy --broadcast -vvvv 
