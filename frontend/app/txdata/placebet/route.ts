import { betRegistryAbi, betRegistryAddress } from "@/app/const/betRegistryAbi";
import { TransactionTargetResponse } from "frames.js";
import { NextRequest, NextResponse } from "next/server";
import { encodeFunctionData } from "viem";



type GeneratePlaceBetData = {
  marketId: string;
  betSize: string;
  betDirection: string;
}

const generatePlaceBetData = (data: GeneratePlaceBetData): TransactionTargetResponse => {
  const { marketId, betSize, betDirection } = data;
  console.log('generatePlaceBetData', data)
  console.log('as args', [BigInt(marketId), BigInt(betSize), Number(betDirection)])
  return {
    chainId: "eip155:84532",
    method: "eth_sendTransaction",
    // attribution: false,
    params: {
      abi: [],
      to: betRegistryAddress,
      value: "0",
      data: encodeFunctionData({
        abi: betRegistryAbi,
        functionName: 'placeBet',
        args: [BigInt(marketId), BigInt(betSize), Number(betDirection)],
      })
    },
  };
}

export function POST(
  req: NextRequest,
): NextResponse<{ error: string } | TransactionTargetResponse> {
  const searchParams = req.nextUrl.searchParams
  const marketId = searchParams.get('marketId')
  const betSize = searchParams.get('betSize')
  const betDirection = searchParams.get('betDirection')

  if (!marketId || !betSize || !betDirection) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const placeBetData = generatePlaceBetData({ marketId, betSize, betDirection });
  console.log('POST /txdata/placebet req', placeBetData);
  return NextResponse.json(placeBetData);
}
