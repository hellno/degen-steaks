/* eslint-disable react/jsx-key */
import { frames, DEFAULT_MARKET_ID, baseUrl, baseUrlFrames } from "../frames";
import { Button } from "frames.js/next";
import {
  getUserCashedOutAmountFromMarket,
  getUserWasRight,
} from "@/app/lib/utils";
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
  const userCashedOutAmount =
    userHasWon && getUserCashedOutAmountFromMarket(marketData);

  const updatedState = {
    ...currentState,
    marketId: marketData?.id || DEFAULT_MARKET_ID,
  };

  const renderMainButton = () => {
    let button;
    if (marketData.isResolved && userHasWon) {
      if (userCashedOutAmount) {
        const intentUrl = `https://warpcast.com/~/compose?text=just%20won%20${userCashedOutAmount.toFixed(2)}%20%24DEGEN%20%F0%9F%A5%A9%F0%9F%94%A5%20on%20${baseUrlFrames}&embeds[]=${baseUrlFrames}`;
        button = (
          <Button action="link" target={intentUrl}>
            Share your win 🥳
          </Button>
        );
      } else {
        button = (
          <Button
            action="tx"
            target={`${baseUrl}/txdata/cashOut?marketId=${marketData.id}`}
            post_url="/viewMarket"
          >
            Claim winnings
          </Button>
        );
      }
    }
    if (!marketData.isResolved) {
      button = (
        <Button action="post" target="/decide">
          Place bet
        </Button>
      );
    }
    return button;
  };

  return {
    state: updatedState,
    image: getImageForMarket(marketData, true),
    buttons: [
      renderMainButton(),
      transactionId && (
        renderTransactionLinkButton(transactionId)
      ),
      !marketData.isResolved && (
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
