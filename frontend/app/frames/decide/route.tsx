/* eslint-disable react/jsx-key */
import { frames, DEFAULT_DEGEN_BETSIZE, DEFAULT_MARKET_ID } from "../frames";
import { Button } from "frames.js/next";
import {
  convertMillisecondsToDelta,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { BetDirection } from "@/app/types";
import { formatEther } from "viem";
import { getProgressbarFromMarketData } from "@/app/components/FrameUI";
import { getMarketDataFromContext } from "@/app/lib/framesUtils";

const handleRequest = frames(async (ctx: any) => {
  if (ctx.isAllowed !== undefined && !ctx.isAllowed) {
    return {
      image: (
        <div tw="flex flex-col text-center items-center justify-center self-center text-5xl w-2/3">
          You need the early access NFT to use DEGEN steaks
        </div>
      ),
      buttons: [
        <Button
          action="post"
          target={{
            pathname: "/",
          }}
        >
          Home 🏠
        </Button>,
        <Button
          action="link"
          target="https://zora.co/collect/base:0xb5935092048f55d61226ec10b72b30e81818b811/1"
        >
          Mint early access
        </Button>,
      ],
      imageOptions: {
        aspectRatio: "1:1",
      },
    };
  }

  const currentState = ctx.state;

  // get latest market data
  // update the state
  // if (!ctx?.message?.isValid) {
  //   throw new Error("Invalid Frame");
  // }

  // console.log("ctx.message", ctx.message);
  const marketData = await getMarketDataFromContext(ctx);
  const timeDelta = marketData?.endTime
    ? marketData.endTime * 1000 - new Date().getTime()
    : 0;
  const hasEnded = timeDelta < 0;

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

    const marketEndDescription =
      timeDelta > 0
        ? `Ends in ${convertMillisecondsToDelta(timeDelta)}.`
        : `This market is closed. It ended ${convertMillisecondsToDelta(
            timeDelta
          )} ${timeDelta ? "ago" : ""}`;

    return (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-8xl">Will the $DEGEN price</p>
          <p tw="text-5xl">go above 🔼 or below 🔽</p>
          <p tw="text-8xl">
            {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}
          </p>
          {marketEndDescription}
          <div tw="flex mt-24">{getProgressbarFromMarketData(marketData)}</div>
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

  const getButtonsForMarket = (): any => {
    if (hasEnded) {
      return [
        <Button action="post" target="/viewMarket">
          View market
        </Button>,
        <Button action="post" target="/">
          Home 🏠
        </Button>,
      ];
    }
    return [
      <Button
        action="post"
        target={{
          pathname: "/pendingPayment",
          query: { betDirection: BetDirection.LOWER },
        }}
      >
        🔽 LOWER
      </Button>,
      <Button
        action="post"
        target={{
          pathname: "/pendingPayment",
          query: { betDirection: BetDirection.HIGHER },
        }}
      >
        🔼 HIGHER
      </Button>,
    ];
  };

  return {
    state: updatedState,
    image: getImageForMarket(),
    textInput: hasEnded
      ? undefined
      : `${formatEther(BigInt(DEFAULT_DEGEN_BETSIZE))}`,
    buttons: getButtonsForMarket(),
    imageOptions: {
      aspectRatio: "1:1",
    },
  };
});

export const POST = handleRequest;
