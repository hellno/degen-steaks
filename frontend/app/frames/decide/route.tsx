/* eslint-disable react/jsx-key */
import { frames, DEFAULT_DEGEN_BETSIZE, DEFAULT_MARKET_ID } from "../frames";
import { Button } from "frames.js/next";
import { getFrameMessage } from "frames.js";
import { getDefaultOpenMarket, getMarket } from "../../lib/indexerUtils";
import {
  convertMillisecondsToDelta,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { BetDirection } from "@/app/types";
import { formatEther } from "viem";
import { getProgressBar, getProgressbarFromMarketData } from "@/app/components/FrameUI";
import { getMarketDataFromContext } from "@/app/lib/framesUtils";

const handleRequest = frames(async (ctx) => {
  const currentState = ctx.state;

  // get latest market data
  // update the state
  // if (!ctx?.message?.isValid) {
  //   throw new Error("Invalid Frame");
  // }

  console.log("ctx.message", ctx.message);
  const marketData = await getMarketDataFromContext(ctx);

  const updatedState = {
    ...currentState,
    marketId: marketData?.id || DEFAULT_MARKET_ID,
  };

  const getImageForMarket = () => {
    if (!marketData) {
      return <div tw="flex">Loading...</div>;
    }
    const { isResolved, endPrice, targetPrice, highWon, bets } = marketData;
    if (isResolved && endPrice) {
      const userWasRight = getUserWasRight(marketData);

      return (
        <div tw="flex flex-col">
          <div tw="flex flex-col self-center text-center justify-center items-center">
            <p tw="text-7xl">DEGEN steak is done 🔥🧑🏽‍🍳</p>
            <p tw="text-5xl">
              Price was {renderDegenPriceFromContract(endPrice)}{" "}
              {renderDegenPriceFromContract(targetPrice)}-{">"}{" "}
              {highWon || "TBD"}
            </p>
            {userWasRight !== undefined && (
              <p tw="text-6xl">You {userWasRight ? "won 🤩" : "lost 🫡"} </p>
            )}
          </div>
        </div>
      );
    }
    console.log("marketData", marketData);
    const timeDelta = marketData.endTime * 1000 - new Date().getTime();
  
    const marketEndDescription =
      timeDelta > 0
        ? `Ends in ${convertMillisecondsToDelta(timeDelta)}.`
        : `This market is closed. It ended ${convertMillisecondsToDelta(
            timeDelta
          )} ago.`;

    return (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-8xl">Will the $DEGEN price</p>
          <p tw="text-5xl">go above 🔼 or below 🔽</p>
          <p tw="text-8xl">
            {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}
          </p>
          {marketEndDescription}
          <div tw="flex mt-24">
            {getProgressbarFromMarketData(marketData)}
          </div>
          <div tw="flex mt-24">
            {marketData.degenCollected !== "0" ? (
              <p tw="text-5xl">
                {formatEther(BigInt(marketData.degenCollected))} DEGEN steaked
              </p>
            ) : (
              <p tw="text-5xl">Place the first bet, no fees for you!</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return {
    state: updatedState,
    image: getImageForMarket(),
    textInput: `${formatEther(BigInt(DEFAULT_DEGEN_BETSIZE))}`,
    buttons: [
      <Button
        action="post"
        target={{
          pathname: "/pendingPayment",
          query: { betDirection: BetDirection.LOWER },
        }}
      >
        Lower 🔽
      </Button>,
      <Button
        action="post"
        target={{
          pathname: "/pendingPayment",
          query: { betDirection: BetDirection.HIGHER },
        }}
      >
        Higher 🔼
      </Button>,
    ],
    imageOptions: {
      aspectRatio: "1:1",
    },
  };
});

export const POST = handleRequest;
