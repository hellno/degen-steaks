import { NextRequest, NextResponse } from "next/server";


export function GET(req: NextRequest): NextResponse {
  console.log('GET /txdata req', JSON.stringify(req));
  return NextResponse.json({ message: 'nothing to see here' });
};
