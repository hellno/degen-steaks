import clsx from "clsx";
import { BetType, MarketType } from "../types";
import { Button } from "frames.js/next";
import {
  convertMillisecondsToDelta,
  getMaxMultiplierForMarket,
  getUserCashedOutAmountFromMarket,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { formatEther } from "viem";
import { baseUrl, baseUrlFrames } from "../frames/frames";

export const renderTransactionLinkButton = (transactionId: string) => (
  <Button action="link" target={`https://www.onceupon.gg/tx/${transactionId}`}>
    View transaction
  </Button>
);

export const getProgressbarFromMarketData = (marketData: MarketType) => {
  const sharesHigher = Number(
    formatEther(BigInt(marketData.totalSharesHigher))
  );
  const sharesLower = Number(formatEther(BigInt(marketData.totalSharesLower)));

  let ratioHigher: number, ratioLower: number;
  if (sharesHigher || sharesLower) {
    const allShares = sharesHigher + sharesLower;
    ratioHigher = sharesHigher / allShares;
    ratioLower = sharesLower / allShares;
  } else {
    ratioLower = 69;
    ratioHigher = 31;
  }

  return getProgressBar({
    a: 100 * ratioHigher,
    b: 100 * ratioLower,
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
              {aPercentage > 20 && `${aPercentage.toFixed(0)}% ⬆️`}
              {aPercentage > 40 && " HIGHER"}
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
              {bPercentage > 20 && `${bPercentage.toFixed(0)}% ⬇️`}
              {bPercentage > 40 && " LOWER"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const getImageForMarket = ({
  market,
  showPastBets,
}: {
  market: MarketType;
  showPastBets: boolean;
}) => {
  if (!market) {
    return <div tw="flex">Loading...</div>;
  }
  const { isResolved, endPrice, targetPrice, highWon } = market;
  if (isResolved && endPrice) {
    const userWasRight = getUserWasRight(market);
    // console.log(market);
    return (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">steaks are ready 🔥🧑🏽‍🍳</p>
          <p tw="text-5xl w-2/3">
            Final price was {renderDegenPriceFromContract(endPrice)} which is{" "}
            {highWon ? "⬆️ higher" : "⬇️ lower"} than{" "}
            {renderDegenPriceFromContract(targetPrice)}
          </p>
          {userWasRight !== undefined && (
            <p tw="text-8xl">You {userWasRight ? "won 🤩" : "lost 🫡"} </p>
          )}
          {getProgressbarFromMarketData(market)}
          <div tw="flex mt-12">
            <p tw="text-5xl">
              {formatEther(BigInt(market.degenCollected))} DEGEN steaked
            </p>
          </div>
          {userWasRight && (
            <div tw="flex flex-col text-center items-center self-center">
              <p tw="text-5xl mt-4">🎉 Congratulations! 🎉</p>
              <p tw="text-5xl -mt-4">Claim your winnings below</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const timeDelta = market.endTime * 1000 - new Date().getTime();
  const marketEndDescription =
    timeDelta > 0
      ? `Ends in ${convertMillisecondsToDelta(timeDelta)}`
      : `Ended ${convertMillisecondsToDelta(timeDelta)} ago`;
  const maxMultiplier = getMaxMultiplierForMarket(market);

  return (
    <div tw="flex flex-col">
      <div tw="flex flex-col self-center text-center justify-center items-center">
        <p tw="text-6xl">Will the $DEGEN price be</p>
        <p tw="-mt-4">⬆️ higher or ⬇️ lower than</p>
        <p tw="-mt-4 mb-24 text-7xl">
          {renderDegenPriceFromContract(BigInt(market.targetPrice))}? 🤔
        </p>
        {marketEndDescription}
        <div tw="flex mt-8">{getProgressbarFromMarketData(market)}</div>
        <div tw="flex -mt-8">
          <p tw="text-3xl">bet distribution</p>
        </div>
        <div tw="flex mt-2">
          <p tw="text-5xl">
            {formatEther(BigInt(market.degenCollected))} DEGEN steaked
          </p>
        </div>
        {!!maxMultiplier && (
          <p tw="text-5xl">
            🔥 max potential return {maxMultiplier.toFixed(2)}% 🔥
          </p>
        )}
        {showPastBets && renderBets(market)}
      </div>
    </div>
  );
};

export const renderBets = (marketData: MarketType) => {
  const bets = marketData.bets;
  if (!bets || !bets.length || !bets[0]?.placedBets) return null;
  const allDegenSum = bets.reduce(
    (acc, bet) =>
      bet.placedBets
        ? acc +
          bet.placedBets.reduce(
            (acc, placedBet) => acc + Number(placedBet.degen),
            0
          )
        : acc,
    0
  );
  return (
    <div tw="flex flex-col">
      <p tw="text-5xl">Your bet</p>
      <div tw="flex flex-col -mt-14">
        <p tw="text-5xl">
          {Number(formatEther(BigInt(allDegenSum))).toFixed(2)} DEGEN
        </p>
      </div>
    </div>
  );
};

export const renderMarketMainButton = ({ market }: { market: MarketType }) => {
  let button;
  const userHasWon = getUserWasRight(market);
  const userCashedOutAmount =
    userHasWon && getUserCashedOutAmountFromMarket(market);

  if (market.isResolved && userHasWon) {
    if (userCashedOutAmount) {
      const intentUrl = `https://warpcast.com/~/compose?text=just%20won%20${userCashedOutAmount.toFixed(
        2
      )}%20%24DEGEN%20%F0%9F%A5%A9%F0%9F%94%A5%20on%20${baseUrlFrames}&embeds[]=${baseUrlFrames}`;
      button = (
        <Button action="link" target={intentUrl}>
          Share your win 🥳
        </Button>
      );
    } else {
      button = (
        <Button
          action="tx"
          target={`${baseUrl}/txdata/cashOut?marketId=${market.id}`}
          post_url="/viewMarket"
        >
          Cashout 💸
        </Button>
      );
    }
  }
  const timeDelta = market.endTime * 1000 - new Date().getTime();
  if (!market.isResolved && timeDelta > 0) {
    button = (
      <Button action="post" target="/decide">
        Place bet 🎩
      </Button>
    );
  }
  return button;
};
