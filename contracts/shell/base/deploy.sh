#!/usr/bin/env bash

# To load the variables in the .env file
source .env

# To deploy and verify our contract
NETWORK=base forge script BaseDeployment --rpc-url https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY -vvvv --slow --private-key $DEPLOYER_PK --verify
