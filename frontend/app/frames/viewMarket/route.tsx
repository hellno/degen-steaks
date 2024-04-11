/* eslint-disable react/jsx-key */
import { frames, DEFAULT_MARKET_ID, baseUrl } from "../frames";
import { Button } from "frames.js/next";
import { getUserWasRight } from "@/app/lib/utils";
import {
  getImageForMarket,
  renderTransactionLinkButton,
} from "@/app/components/FrameUI";
import { getMarketDataFromContext } from "@/app/lib/framesUtils";

const handleRequest = frames(async (ctx: any) => {
  const currentState = ctx.state;
  const marketData = await getMarketDataFromContext(ctx);
  const transactionId = ctx.message?.transactionId;
  const userHasWon = getUserWasRight(marketData);

  const updatedState = {
    ...currentState,
    marketId: marketData?.id || DEFAULT_MARKET_ID,
  };

  return {
    state: updatedState,
    image: getImageForMarket(marketData, true),
    buttons: [
      marketData.isResolved && userHasWon && (
        <Button
          action="tx"
          target={`${baseUrl}/txdata/cashOut?marketId=${marketData.id}`}
          post_url="/viewMarket"
        >
          Claim winnings
        </Button>
      ),
      !marketData.isResolved && (
        <Button action="post" target="/decide">
          Place bet
        </Button>
      ),
      transactionId ? (
        renderTransactionLinkButton(transactionId)
      ) : (
        <Button action="post" target={{ pathname: "/viewMarket" }}>
          🔄 Refresh
        </Button>
      ),
      marketData.id && (
        <Button
          action="post"
          target={{
            pathname: "/viewMarket",
            query: { marketId: marketData.id - 1 },
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
