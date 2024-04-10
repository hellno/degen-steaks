/* eslint-disable react/jsx-key */
import { formatEther, parseEther } from "viem";
import { DEFAULT_DEGEN_BETSIZE, State, baseUrl, frames } from "../frames";
import { Button } from "frames.js/next";
import { BetDirection, BetType } from "@/app/types";
import { renderDegenPriceFromContract } from "@/app/lib/utils";
import clsx from "clsx";
import {
  getMarketDataFromContext,
  getUserAddressesFromContext,
} from "@/app/lib/framesUtils";
import { hasAnyDegenAllowance } from "@/app/lib/onchainUtils";

const getPaymentButton = ({
  marketId,
  betSize,
  betDirection,
  hasAllowance,
}: State): React.ReactElement => {
  if (hasAllowance) {
    return (
      <Button
        action="tx"
        target={`${baseUrl}/txdata/placebet?marketId=${marketId}&betSize=${betSize}&betDirection=${betDirection}`}
        post_url="/pendingPayment"
      >
        Place bet
      </Button>
    );
  } else {
    return (
      <Button
        action="tx"
        target={`${baseUrl}/txdata/approvedegen?approvalAmount=${betSize}`}
        post_url="/pendingPayment"
      >
        Approve spending
      </Button>
    );
  }
};

const getViewMarketButton = (): React.ReactElement => (
  <Button action="post" target="/viewMarket">
    View market
  </Button>
);

const getMarketWebLinkButton = (marketId: string): React.ReactElement => (
  <Button action="link" target={`${baseUrl}/web/market/${marketId}`}>
    Web
  </Button>
);

const renderTransactionLinkButton = (transactionId: string) => (
  <Button action="link" target={`https://www.onceupon.gg/tx/${transactionId}`}>
    View transaction
  </Button>
);

export const POST = frames(async (ctx: any) => {
  const transactionId = ctx.message?.transactionId;
  const betDirectionFromSearchparams = ctx.searchParams
    .betDirection as unknown as BetDirection;
  const betDirection = ctx.state.betDirection || betDirectionFromSearchparams;
  const userAddresses = getUserAddressesFromContext(ctx);
  const hasAllowance = await hasAnyDegenAllowance(userAddresses);

  if (betDirection === undefined) {
    return {
      image: <div tw="flex">No bet direction - something went wrong</div>,
      buttons: [
        <Button action="post" target="/">
          Home 🏠
        </Button>,
      ],
    };
  }

  const newBetSize = ctx.message?.inputText
    ? parseEther(ctx.message.inputText)
    : BigInt(DEFAULT_DEGEN_BETSIZE);
  const state = ctx.state as State;

  const updatedState = {
    ...state,
    hasAllowance,
    betDirection,
    betSize: state.betSize || newBetSize.toString(),
  };

  const marketData = await getMarketDataFromContext(ctx);
  const hasBets = marketData && marketData?.bets && marketData?.bets.length > 0;
  
  const renderBets = (bets: BetType[] | undefined) => {
    if (!bets || !bets.length || !bets[0]?.placedBets) return null;
    const allDegenSum = bets[0]?.placedBets.reduce(
      (acc, bet) => acc + Number(bet.degen),
      0
    );
    return (
      <div tw="flex flex-col mt-4">
        <p tw="text-3xl">Your bet in this market:</p>
        <div tw="flex flex-col -mt-16">
          {bets.map((bet) => (
            <div tw="flex flex-row">
              <p tw="text-3xl">
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
  
  const getImageForPendingPayment = () => {
    const { hasAllowance, betSize, betDirection } = updatedState;
    const youAreHere = " ← You are here";

    return (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">Start steaking your $DEGEN</p>
          <div tw="flex flex-col text-5xl">
            <p
              tw={clsx(
                !hasAllowance
                  ? "py-6 px-8 bg-green-400 rounded-xl shadow-lg"
                  : "text-gray-500"
              )}
            >
              1. Approve $DEGEN {!hasAllowance && youAreHere}
            </p>
            <p tw="text-gray-500 -mt-8">2. Refresh</p>
            <p
              tw={clsx(
                hasAllowance
                  ? "py-6 px-8 bg-green-400 rounded-xl shadow-lg"
                  : "text-gray-500"
              )}
            >
              3. Place bet {hasAllowance && youAreHere}
            </p>
            <p tw="text-gray-500 -mt-8">4. Check out the market</p>
          </div>
        </div>
        {betSize && betDirection !== undefined ? (
          <div tw="flex flex-col mt-20">
            <span>
              Your bet: {formatEther(BigInt(betSize))} $DEGEN{" "}
              {betDirection === BetDirection.LOWER ? "below" : "above"}{" "}
              {renderDegenPriceFromContract(BigInt(marketData.targetPrice))} on{" "}
            </span>
            <span>
              {new Date(marketData.endTime * 1000).toString().split("(")[0] ||
                ""}
            </span>
            <span tw="mt-4">
              🤯 You will lose your funds if you bet on the wrong side! 🤯
            </span>
            <span tw="mt-4">Refresh to check allowance or bet status</span>
          </div>
        ) : null}
        {renderBets(marketData?.bets)}
      </div>
    );
  };
  return {
    state: updatedState,
    image: getImageForPendingPayment(),
    buttons: [
      getPaymentButton(updatedState),
      hasBets ? getViewMarketButton() : undefined,
      transactionId ? renderTransactionLinkButton(transactionId) : undefined,
      <Button action="post" target="/pendingPayment">
        Refresh 🔄
      </Button>,
      // <Button action="post" target="/">
      //   Home 🏠
      // </Button>,
    ],
    imageOptions: {
      aspectRatio: "1:1",
    },
  };
});
