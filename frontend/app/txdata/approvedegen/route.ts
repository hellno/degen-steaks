import { TransactionTargetResponse } from "frames.js";
import { NextRequest, NextResponse } from "next/server";
import { degenAbi, degenContractAddress } from "../../const/degenAbi";
import { encodeAbiParameters, encodeFunctionData, encodePacked, parseAbiParameters } from "viem";
import { betRegistryAddress } from "../../const/betRegistryAbi";
import { publicClient } from "../../viemClient";


const chainId = "eip155:84532"; // BASE SEPOLIA
// const chainId = "eip155:8453"; // BASE MAINNET

const approveFunctionHumanReadable = "function approve(address spender, uint256 amount) returns (bool)";

const data: TransactionTargetResponse & { attribution: boolean } = {
  chainId,
  method: "eth_sendTransaction",
  attribution: false,
  params: {
    abi: [],
    to: degenContractAddress,
    value: "0",
    data: encodeFunctionData({
      abi: degenAbi,
      functionName: 'approve',
      args: [betRegistryAddress, 5173516296586040333n],
    }),
  },
};

// const simulateContract = async () => {
//   console.log('simulateContract')
//   const { result } = await publicClient.simulateContract({
//     address: degenContractAddress,
//     abi: degenAbi,
//     functionName: 'approve',
//     args: [betRegistryAddress, 5173516296586040333n],
//     account: '0x36E31d250686E9B700c8A2a08E98458004E4D988'
//   })

//   console.log('encodeAbiParams', encodeAbiParameters(
//     parseAbiParameters("address spender, uint256 amount"),
//     [betRegistryAddress, 5173516296586040333n]
//   ))

//   const encodedData = encodeAbiParameters(
//     degenAbi[0].inputs,
//     [betRegistryAddress,
//     5173516296586040333n,
//     ],
//   )

//   console.log('encodedData', encodedData);

//   console.log("encodeFunctionData", encodeFunctionData({
//     abi: degenAbi,
//     functionName: 'approve',
//     args: [betRegistryAddress, 420n],
//   }))

//   console.log('encodePacked', encodePacked(
//     ["address", "uint256"],
//     [betRegistryAddress, 420n]
//   ))
//   console.log('simulateContract result', result);
// }

export function POST(
  req: NextRequest
): NextResponse<TransactionTargetResponse> {
  console.log('POST /txdata/approvedegen req', JSON.stringify(req));
  // simulateContract();

  return NextResponse.json(data);
}

export function GET(req: NextRequest): NextResponse<TransactionTargetResponse> {
  console.log('GET /txdata/approvedegen req', JSON.stringify(req));
  return NextResponse.json(data);
};
