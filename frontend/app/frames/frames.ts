import { createFrames } from "frames.js/next";
import { BetDirection, MarketType } from "../types";
import { farcasterHubContext } from "frames.js/middleware";
import {
    TokenBlockchain,
    AllowListCriteriaEnum as AllowListCriteria,
    allowListFramesjsMiddleware as allowList,
} from "@airstack/frames";


export const DEFAULT_MARKET_ID = -1;

// enum PageState {
//     start = "start",
//     decide = "decide",
//     pending_payment = "pending_payment",
//     view_market = "view_market",
// }

type State = {
    // pageState: PageState;
    marketId: number;
    hasAllowance?: boolean;
    betSize?: string;
    betDirection?: BetDirection;
};

const initialState: State = {
    // pageState: PageState.start,
    marketId: DEFAULT_MARKET_ID,
    hasAllowance: undefined,
};

export const frames = createFrames<State>({
    middleware: [
        farcasterHubContext({
            hubHttpUrl: "https://nemes.farcaster.xyz:2281",
            // hubRequestOptions: {
            //     headers: {
            //         "Content-Type": "application/json",
            //         "api_key": "",
            //     },
            // },
        }),
        allowList({
            apiKey: process.env.AIRSTACK_API_KEY as string,
            criteria: {
                and: [
                    [
                        // must hold early access NFT release on Base
                        AllowListCriteria.TOKEN_MINT, {
                            address: "0xb5935092048f55d61226ec10b72b30e81818b811",
                            chain: TokenBlockchain.Base,
                        }
                    ],
                    [
                        // must hold DEGEN on Base
                        AllowListCriteria.TOKEN_HOLD, {
                            chain: TokenBlockchain.Base,
                            address: "0x4c17ff12d9a925a0dec822a8cbf06f46c6268553",
                        }
                    ]
                ],
            },
        }),
    ],

    basePath: "/frames",
    initialState,
});
