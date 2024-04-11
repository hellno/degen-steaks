import clsx from "clsx";
import { MarketType } from "../types";
import { Button } from "frames.js/next";

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
