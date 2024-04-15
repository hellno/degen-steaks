import { Button } from "frames.js/next";
import { frames } from "./frames";
import {
  getImageForMarket,
  renderMarketMainButton,
} from "../components/FrameUI";
import { getDefaultOpenMarket, getMarket } from "../lib/indexerUtils";
import { MarketType } from "../types";

const handleRequest = frames(async (ctx: any) => {
  const marketIdFromSearchParams = ctx.searchParams?.marketId as string;
  let market: MarketType;
  if (marketIdFromSearchParams) {
    market = await getMarket(marketIdFromSearchParams, []);
  } else {
    market = await getDefaultOpenMarket([]);
  }

  return {
    image: getImageForMarket({ market, showPastBets: false }),
    buttons: [
      renderMarketMainButton({ market }),
      marketIdFromSearchParams && (
        <Button
          key="placeBet"
          action="post"
          target={`/viewMarket?marketId=${market.id}`}
        >
          Did you win? 💸
        </Button>
      ),
      <Button key="learnMore" action="post" target="/learnMore">
        Learn More ➡️
      </Button>,
      <Button key="viewMarket" action="post" target="/viewMarket?resetMarketId=true">
        Latest market 🥩
      </Button>,
    ],
    imageOptions: {
      aspectRatio: "1:1",
    },
    headers: {
      // Max cache age in seconds
      // update every 5mins
      "Cache-Control": "max-age=300",
    },
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
