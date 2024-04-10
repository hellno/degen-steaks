/* eslint-disable react/jsx-key */
import { frames, DEFAULT_MARKET_ID } from "../frames";
import { Button } from "frames.js/next";
import { getFrameMessage } from "frames.js";
import { getDefaultOpenMarket, getMarket } from "../../lib/indexerUtils";
import {
  convertMillisecondsToDelta,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { MarketType } from "@/app/types";
import { formatEther } from "viem";
import { getProgressBar } from "@/app/components/FrameUI";
import { getMarketDataFromContext } from "@/app/lib/framesUtils";

const handleRequest = frames(async (ctx) => {
  const currentState = ctx.state;

  // get latest market data
  // update the state
  // if (!ctx?.message?.isValid) {
  //   throw new Error("Invalid Frame");
  // }
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

    const timeDelta = marketData.endTime * 1000 - new Date().getTime();
    const sharesLower =
      marketData.totalSharesLower /
      (marketData.totalSharesLower + marketData.totalSharesHigher);
    const sharesHigher =
      marketData.totalSharesHigher /
      (marketData.totalSharesLower + marketData.totalSharesHigher);

    const marketEndDescription =
      timeDelta > 0
        ? `Ends in ${convertMillisecondsToDelta(timeDelta)}`
        : `Ended ${convertMillisecondsToDelta(timeDelta)} ago`;

    console.log("marketData", marketData);

    return (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-5xl">Will the $DEGEN price be</p>
          <p>above 🔼 or below 🔽</p>
          <p tw="text-7xl">
            {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}
          </p>
          {marketEndDescription}
          <div tw="flex mt-24">
            {getProgressBar({
              a: 100 * Number(sharesLower),
              b: 100 * Number(sharesHigher),
            })}
          </div>
          <div tw="flex mt-24">
            <p tw="text-5xl">
              {formatEther(BigInt(marketData.degenCollected))} DEGEN steaked
            </p>
          </div>
        </div>
      </div>
    );
  };

  return {
    state: updatedState,
    image: getImageForMarket(),
    buttons: [
      <Button action="post" target={{ pathname: "/viewMarket" }}>
        Refresh
      </Button>,
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
