import clsx from "clsx";
import { BetType, MarketType } from "../types";
import { Button } from "frames.js/next";
import {
  convertMillisecondsToDelta,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { formatEther } from "viem";

export const renderTransactionLinkButton = (transactionId: string) => (
  <Button action="link" target={`https://www.onceupon.gg/tx/${transactionId}`}>
    View transaction
  </Button>
);

export const getProgressbarFromMarketData = (marketData: MarketType) => {
  let sharesLower =
    marketData.totalSharesLower /
    (marketData.totalSharesLower + marketData.totalSharesHigher);
  let sharesHigher =
    marketData.totalSharesHigher /
    (marketData.totalSharesLower + marketData.totalSharesHigher);

  if (!sharesLower && !sharesHigher) {
    sharesLower = 69n;
    sharesHigher = 31n;
  }

  return getProgressBar({
    a: 100 * Number(sharesHigher),
    b: 100 * Number(sharesLower),
  });
};

export const getProgressBar = ({ a, b }: { a: number; b: number }) => {
  if (!a && !b) return null;

  const aPercentage = (a / (a + b)) * 100;
  const bPercentage = (b / (a + b)) * 100;
  const shouldRenderA = aPercentage > 1 && a + b > 0;
  const shouldRenderB = bPercentage > 1 && a + b > 0;
  return (
    <div tw="flex justify-center px-12">
      <div tw="flex h-24 rounded-lg">
        <div
          tw={clsx(
            shouldRenderB ? "rounded-l-full" : "rounded-full",
            "flex border-gray-500 w-full bg-green-400"
          )}
          style={{ width: `${shouldRenderA ? (a / (a + b)) * 100 : 0}%` }}
        >
          {aPercentage > 5 ? (
            <div tw="flex justify-center items-center w-full font-bold text-gray-100">
              {aPercentage > 20 && `${aPercentage.toFixed(0)}%`}
              {aPercentage > 40 && " ⬆️ HIGHER"}
            </div>
          ) : null}
        </div>
        <div
          tw={clsx(
            shouldRenderA ? "rounded-r-full" : "rounded-full",
            "flex w-full bg-red-500"
          )}
          style={{ width: `${shouldRenderB ? (b / (a + b)) * 100 : 0}%` }}
        >
          {bPercentage > 5 ? (
            <div tw="flex justify-center items-center w-full font-bold text-gray-100">
              {bPercentage > 20 && `${bPercentage.toFixed(0)}%`}
              {bPercentage > 40 && " ⬇️ LOWER"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};


export const getImageForMarket = (marketData: MarketType, showPastBets: boolean) => {
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
        <p>⬆️ higher or ⬇️ lower</p>
        <p tw="text-7xl">
          {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}
        </p>
        {marketEndDescription}
        <div tw="flex mt-24">{getProgressbarFromMarketData(marketData)}</div>
        <div tw="flex -mt-8">
          <p tw="text-3xl">
            bet distribution
          </p>
        </div>
        <div tw="flex mt-12">
          <p tw="text-5xl">
            {formatEther(BigInt(marketData.degenCollected))} DEGEN steaked
          </p>
        </div>
        {showPastBets && renderBets(marketData, bets)}
      </div>
    </div>
  );
};

export const renderBets = (marketData: MarketType, bets: BetType[] | undefined) => {
  if (!bets || !bets.length || !bets[0]?.placedBets) return null;
  const allDegenSum = bets[0]?.placedBets.reduce(
    (acc, bet) => acc + Number(bet.degen),
    0
  );
  return (
    <div tw="flex flex-col">
      <p tw="text-5xl">Your bet:</p>
      <div tw="flex flex-col">
        {bets.map((bet) => (
          <div tw="flex flex-row" key={`bet-${bet.id}`}>
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
