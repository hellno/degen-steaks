import { TransactionTargetResponse } from "frames.js";
import { NextRequest, NextResponse } from "next/server";
import { degenAbi, degenContractAddress } from "../../const/degenAbi";
import { encodeFunctionData } from "viem";
import { betRegistryAddress } from "../../const/betRegistryAbi";


const chainId = "eip155:8453"; // BASE MAINNET

const getApprovalData = ({ approvalAmount }: { approvalAmount: string }) => {
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
        args: [betRegistryAddress, BigInt(approvalAmount)],
      }),
    },
  };
  return data;
}

export function POST(
  req: NextRequest
): NextResponse<{ error: string } | TransactionTargetResponse> {
  const searchParams = req.nextUrl.searchParams
  const approvalAmount = searchParams.get('approvalAmount')

  if (!approvalAmount) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const approvalData = getApprovalData({ approvalAmount });
  console.log('POST /txdata/approvedegen req', approvalData);
  return NextResponse.json(approvalData);
}
