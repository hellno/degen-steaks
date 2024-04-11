import { betRegistryAbi, betRegistryAddress } from "@/app/const/betRegistryAbi";
import { TransactionTargetResponse } from "frames.js";
import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData } from "viem";



type GenerateCashOutBetData = {
  marketId: string;
}

const generateCashOutBetData = (data: GenerateCashOutBetData): TransactionTargetResponse & { attribution: boolean } => {
  const { marketId } = data;
  return {
    chainId: "eip155:8453",
    method: "eth_sendTransaction",
    attribution: false,
    params: {
      abi: [],
      to: betRegistryAddress,
      value: "0",
      data: encodeFunctionData({
        abi: betRegistryAbi,
        functionName: 'cashOut',
        args: [BigInt(marketId)],
      })
    },
  };
}

export function POST(
  req: NextRequest,
): NextResponse<{ error: string } | TransactionTargetResponse> {
  const searchParams = req.nextUrl.searchParams
  const marketId = searchParams.get('marketId')

  if (!marketId) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const placeBetData = generateCashOutBetData({ marketId });
  console.log('POST /txdata/cashOut req', placeBetData);
  return NextResponse.json(placeBetData);
}
