/* eslint-disable react/jsx-key */
import { frames, DEFAULT_MARKET_ID } from "../frames";
import { Button } from "frames.js/next";
import {
  getImageForMarket,
  renderMarketMainButton,
  renderTransactionLinkButton,
} from "@/app/components/FrameUI";
import { getMarketDataFromContext } from "@/app/lib/framesUtils";

const handleRequest = frames(async (ctx: any) => {
  const currentState = ctx.state;
  const market = await getMarketDataFromContext(ctx);
  const transactionId = ctx.message?.transactionId;

  const updatedState = {
    ...currentState,
    marketId: market?.id || DEFAULT_MARKET_ID,
  };

  return {
    state: updatedState,
    image: getImageForMarket({ market, showPastBets: true }),
    buttons: [
      renderMarketMainButton({ market }),
      transactionId && renderTransactionLinkButton(transactionId),
      !market.isResolved && (
        <Button action="post" target={{ pathname: "/viewMarket" }}>
          🔄 Refresh
        </Button>
      ),
      market.id > 4 && (
        <Button
          action="post"
          target={{
            pathname: "/viewMarket",
            query: { marketId: market.id - 1 },
          }}
        >
          ⬅️ Previous Market
        </Button>
      ),
      <Button action="post" target="/">
        Back 🏡
      </Button>,
    ],
    imageOptions: {
      aspectRatio: "1:1",
    },
  };
});

export const POST = handleRequest;
