#!/usr/bin/env bash

# To load the variables in the .env file
source .env


# To deploy and verify our contract
END_TIME=1712754015 TARGET_PRICE=33318565538 NETWORK=base forge script script/base/OpenMarket.s.sol --rpc-url https://base-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY --broadcast -vvvv --slow --legacy --private-key $DEPLOYER_PK
