import { TransactionTargetResponse } from "frames.js";
import { NextRequest, NextResponse } from "next/server";


const data: TransactionTargetResponse = {
  chainId: "eip155:84532",
  method: "eth_sendTransaction",
  params: {
    abi: [], // "function rent(uint256 fid, uint256 units) payable"
    to: "0x00000000fcCe7f938e7aE6D3c335bD6a1a7c593D",
    data: "0x783a112b0000000000000000000000000000000000000000000000000000000000000e250000000000000000000000000000000000000000000000000000000000000001",
    value: "984316556204476",
  },
};

type Params = {
  slug: string[];
}

export function POST(
  req: NextRequest,
  context: { params: Params }
): NextResponse<TransactionTargetResponse> {
  console.log('POST /txdata req', JSON.stringify(req), context);
  return NextResponse.json(data);
}

export function GET(req: NextRequest, context: { params: Params }): NextResponse<TransactionTargetResponse> {
  console.log('GET /txdata req', JSON.stringify(req), context);
  return NextResponse.json(data);
};
