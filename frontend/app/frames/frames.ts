// @ts-nocheck
import { createFrames } from "frames.js/next";
import { BetDirection } from "../types";
import { farcasterHubContext } from "frames.js/middleware";
import {
    TokenBlockchain,
    AllowListCriteriaEnum as AllowListCriteria,
    allowListFramesjsMiddleware as allowList,
} from "@airstack/frames";

export const DEFAULT_DEGEN_BETSIZE = "3000000000000000000000";
export const DEFAULT_MARKET_ID = -1;
export const baseUrl =
    //   process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.NEXT_PUBLIC_HOST ||
    "http://localhost:3000";

export const baseUrlFrames = `${baseUrl}/frames`;

// enum PageState {
//     start = "start",
//     decide = "decide",
//     pending_payment = "pending_payment",
//     view_market = "view_market",
// }

export type State = {
    // pageState: PageState;
    marketId: number;
    hasAllowance?: boolean;
    betSize?: string;
    betDirection?: BetDirection;
};

const initialState: State = {
    marketId: DEFAULT_MARKET_ID,
    hasAllowance: undefined,
};

export const frames: any = createFrames<State>({
    middleware: [
        farcasterHubContext({
            hubHttpUrl: "https://hubs.airstack.xyz",
            hubRequestOptions: {
                headers: {
                    "x-airstack-hubs": process.env.NEXT_PUBLIC_AIRSTACK_API_KEY as string,
                },
            },
        }),
        allowList({
            apiKey: process.env.NEXT_PUBLIC_AIRSTACK_API_KEY as string,
            criteria: {
                or: [
                    // Only allow holders of this token on Base
                    [AllowListCriteria.TOKEN_MINT, {
                        chain: TokenBlockchain.Base,
                        address: "0xb5935092048F55d61226EC10B72b30E81818b811",
                    }],
                ],
            },
        }),
    ],
    basePath: `${baseUrl}/frames`,
    initialState,
});
