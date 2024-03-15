#!/bin/bash

# To load the variables in the .env file
source .env

# Set balance of deployer to 1 ETH
cast rpc anvil_setBalance 0x00590BB9a26AFCABfF0311E937DD72066B4fFC38 1000000000000000000

# To deploy and verify our contract
forge script script/DeployTestnetToLocal.s.sol --fork-url http://localhost:8545 --broadcast -vvvv --legacy
