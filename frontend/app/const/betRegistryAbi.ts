export const betRegistryAbi = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "degenToken_",
          "type": "address",
          "internalType": "contract IERC20"
        },
        {
          "name": "steakedDegen_",
          "type": "address",
          "internalType": "contract IERC4626"
        },
        {
          "name": "priceFeed_",
          "type": "address",
          "internalType": "contract IPriceFeed"
        },
        {
          "name": "degenUtilityDao_",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "cashOut",
      "inputs": [
        { "name": "marketId_", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "createMarket",
      "inputs": [
        { "name": "endTime_", "type": "uint40", "internalType": "uint40" },
        { "name": "targetPrice_", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "degenToken",
      "inputs": [],
      "outputs": [
        { "name": "", "type": "address", "internalType": "contract IERC20" }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "degenUtilityDao",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getBet",
      "inputs": [
        { "name": "marketId_", "type": "uint256", "internalType": "uint256" },
        { "name": "user_", "type": "address", "internalType": "address" }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct IBetRegistry.Bet",
          "components": [
            {
              "name": "amountHigher",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "amountLower",
              "type": "uint256",
              "internalType": "uint256"
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getMarket",
      "inputs": [
        { "name": "marketId_", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [
        {
          "name": "",
          "type": "tuple",
          "internalType": "struct IBetRegistry.Market",
          "components": [
            { "name": "creator", "type": "address", "internalType": "address" },
            { "name": "endTime", "type": "uint40", "internalType": "uint40" },
            {
              "name": "targetPrice",
              "type": "uint256",
              "internalType": "uint256"
            },
            { "name": "endPrice", "type": "uint256", "internalType": "uint256" },
            {
              "name": "totalHigher",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "totalLower",
              "type": "uint256",
              "internalType": "uint256"
            },
            {
              "name": "totalSteakedDegen",
              "type": "uint256",
              "internalType": "uint256"
            },
            { "name": "totalDegen", "type": "uint256", "internalType": "uint256" }
          ]
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "gracePeriod",
      "inputs": [],
      "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "isFan",
      "inputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "marketToUserToBet",
      "inputs": [
        { "name": "marketId", "type": "uint256", "internalType": "uint256" },
        { "name": "user", "type": "address", "internalType": "address" }
      ],
      "outputs": [
        { "name": "amountHigher", "type": "uint256", "internalType": "uint256" },
        { "name": "amountLower", "type": "uint256", "internalType": "uint256" }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "markets",
      "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
      "outputs": [
        { "name": "creator", "type": "address", "internalType": "address" },
        { "name": "endTime", "type": "uint40", "internalType": "uint40" },
        { "name": "targetPrice", "type": "uint256", "internalType": "uint256" },
        { "name": "endPrice", "type": "uint256", "internalType": "uint256" },
        { "name": "totalHigher", "type": "uint256", "internalType": "uint256" },
        { "name": "totalLower", "type": "uint256", "internalType": "uint256" },
        {
          "name": "totalSteakedDegen",
          "type": "uint256",
          "internalType": "uint256"
        },
        { "name": "totalDegen", "type": "uint256", "internalType": "uint256" }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [{ "name": "", "type": "address", "internalType": "address" }],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "placeBet",
      "inputs": [
        { "name": "marketId_", "type": "uint256", "internalType": "uint256" },
        { "name": "amount_", "type": "uint256", "internalType": "uint256" },
        {
          "name": "direction_",
          "type": "uint8",
          "internalType": "enum IBetRegistry.BetDirection"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "priceFeed",
      "inputs": [],
      "outputs": [
        { "name": "", "type": "address", "internalType": "contract IPriceFeed" }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "resolveMarket",
      "inputs": [
        { "name": "marketId_", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setFan",
      "inputs": [
        { "name": "fan_", "type": "address", "internalType": "address" },
        { "name": "isFan_", "type": "bool", "internalType": "bool" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "setGracePeriod",
      "inputs": [
        { "name": "gracePeriod_", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "slash",
      "inputs": [
        { "name": "marketId_", "type": "uint256", "internalType": "uint256" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "steakedDegen",
      "inputs": [],
      "outputs": [
        { "name": "", "type": "address", "internalType": "contract IERC4626" }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        { "name": "newOwner", "type": "address", "internalType": "address" }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "event",
      "name": "BetCashedOut",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "degen",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "marketShares",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "BetPlaced",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "degen",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "steaks",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "feeSteaks",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "betShares",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "direction",
          "type": "uint8",
          "indexed": false,
          "internalType": "enum IBetRegistry.BetDirection"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "FanSet",
      "inputs": [
        {
          "name": "user",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "isFan",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "GracePeriodSet",
      "inputs": [
        {
          "name": "gracePeriod",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "MarketCreated",
      "inputs": [
        {
          "name": "id",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "creator",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "endTime",
          "type": "uint40",
          "indexed": false,
          "internalType": "uint40"
        },
        {
          "name": "targetPrice",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "MarketResolved",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "endPrice",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "totalDegen",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "creatorFee",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "MarketSlashed",
      "inputs": [
        {
          "name": "marketId",
          "type": "uint256",
          "indexed": true,
          "internalType": "uint256"
        },
        {
          "name": "totalDegen",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "creatorFee",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "slashFee",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "daoFee",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "slasher",
          "type": "address",
          "indexed": false,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "AddressEmptyCode",
      "inputs": [
        { "name": "target", "type": "address", "internalType": "address" }
      ]
    },
    {
      "type": "error",
      "name": "AddressInsufficientBalance",
      "inputs": [
        { "name": "account", "type": "address", "internalType": "address" }
      ]
    },
    { "type": "error", "name": "FailedInnerCall", "inputs": [] },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        { "name": "owner", "type": "address", "internalType": "address" }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        { "name": "account", "type": "address", "internalType": "address" }
      ]
    },
    {
      "type": "error",
      "name": "SafeERC20FailedOperation",
      "inputs": [
        { "name": "token", "type": "address", "internalType": "address" }
      ]
    }
  ] as const;

export const betRegistryAddress = "0x68D8E45939926154BD4356105F9bA120169EF606";
