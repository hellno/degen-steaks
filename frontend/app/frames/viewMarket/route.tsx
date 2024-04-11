/* eslint-disable react/jsx-key */
import { frames, DEFAULT_MARKET_ID, baseUrl } from "../frames";
import { Button } from "frames.js/next";
import { getFrameMessage } from "frames.js";
import { getDefaultOpenMarket, getMarket } from "../../lib/indexerUtils";
import {
  convertMillisecondsToDelta,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { BetType, MarketType } from "@/app/types";
import { formatEther } from "viem";
import {
  getProgressBar,
  getProgressbarFromMarketData,
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

  const renderBets = (bets: BetType[] | undefined) => {
    if (!bets || !bets.length || !bets[0]?.placedBets) return null;
    const allDegenSum = bets[0]?.placedBets.reduce(
      (acc, bet) => acc + Number(bet.degen),
      0
    );
    return (
      <div tw="flex flex-col mt-10">
        <p tw="text-5xl">Your bet:</p>
        <div tw="flex flex-col">
          {bets.map((bet) => (
            <div tw="flex flex-row">
              <p tw="text-5xl">
                {formatEther(BigInt(allDegenSum))} DEGEN{" "}
                {bet.sharesHigher === "0" ? "Lower" : "Higher"}{" "}
                {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
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
            <p tw="text-7xl">$DEGEN Steaks are done 🔥🧑🏽‍🍳</p>
            <p tw="text-5xl w-2/3">
              Final price was {renderDegenPriceFromContract(endPrice)} which is{" "}
              {highWon ? "⬆️ higher" : "⬇️ lower"} than{" "}
              {renderDegenPriceFromContract(targetPrice)}
              {highWon || "TBD"}
            </p>
            {userWasRight !== undefined && (
              <p tw="text-8xl">You {userWasRight ? "won 🤩" : "lost 🫡"} </p>
            )}
            {userWasRight && (
              <div tw="flex flex-col text-center items-center self-center">
                <p tw="text-5xl mt-4">
                  🎉 Congratulations! 🎉
                </p><p tw="text-5xl -mt-4">
                  Claim your winnings below
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    const timeDelta = marketData.endTime * 1000 - new Date().getTime();
    const marketEndDescription =
      timeDelta > 0
        ? `Ends in ${convertMillisecondsToDelta(timeDelta)}`
        : `Ended ${convertMillisecondsToDelta(timeDelta)} ago`;

    return (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-5xl">Will the $DEGEN price be</p>
          <p>above 🔼 or below 🔽</p>
          <p tw="text-7xl">
            {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}
          </p>
          {marketEndDescription}
          <div tw="flex mt-24">{getProgressbarFromMarketData(marketData)}</div>
          <div tw="flex mt-20">
            <p tw="text-5xl">
              {formatEther(BigInt(marketData.degenCollected))} DEGEN steaked
            </p>
          </div>
          {renderBets(bets)}
        </div>
      </div>
    );
  };

  return {
    state: updatedState,
    image: getImageForMarket(),
    buttons: [
      userHasWon && (
        <Button
          action="tx"
          target={`${baseUrl}/txdata/cashOut?marketId=${marketData.id}`}
          post_url="/viewMarket"
        >
          Claim winnings
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
