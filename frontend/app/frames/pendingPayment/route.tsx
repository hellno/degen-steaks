/* eslint-disable react/jsx-key */
import { formatEther, parseEther } from "viem";
import { DEFAULT_DEGEN_BETSIZE, State, baseUrl, frames } from "../frames";
import { Button } from "frames.js/next";
import { BetDirection } from "@/app/types";
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
      >
        Place bet
      </Button>
    );
  } else {
    return (
      <Button
        action="tx"
        target={`${baseUrl}/txdata/approvedegen?approvalAmount=${betSize}`}
      >
        Approve spending
      </Button>
    );
  }
};

const getMarketWebLinkButton = (marketId: string): React.ReactElement => {
  return (
    <Button action="link" target={`${baseUrl}/web/market/${marketId}`}>
      Web
    </Button>
  );
};

export const POST = frames(async (ctx) => {
  const betDirectionFromSearchparams = ctx.searchParams
    .betDirection as unknown as BetDirection;
  const betDirection = ctx.state.betDirection || betDirectionFromSearchparams;
  const userAddresses = getUserAddressesFromContext(ctx);
  const hasAllowance = await hasAnyDegenAllowance(userAddresses);
  console.log('hasAllowance', hasAllowance);

  if (betDirection === undefined) {
    return {
      image: <div tw="flex">No bet direction - something went wrong</div>,
      buttons: [
        <Button action="post" target="/">
          Go home
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
  const getImageForPendingPayment = () => {
    const { hasAllowance, betSize, betDirection } = updatedState;
    const youAreHere = " ← You are here";

    return (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">Start steaking your $DEGEN</p>
          <p tw="text-6xl">in two steps</p>
          <div tw="flex flex-col text-5xl">
            <p
              tw={clsx(
                !hasAllowance
                  ? "p-4 bg-green-400 rounded-lg underline"
                  : "text-gray-500"
              )}
            >
              1. Approve $DEGEN {!hasAllowance && youAreHere}
            </p>
            <p
              tw={clsx(
                hasAllowance
                  ? "p-4 bg-green-400 rounded-lg underline"
                  : "text-gray-500"
              )}
            >
              2. Place bet {hasAllowance && youAreHere}
            </p>
          </div>
        </div>
        {betSize && betDirection !== undefined ? (
          <div tw="flex flex-col mt-36">
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
      </div>
    );
  };
  return {
    state: updatedState,
    image: getImageForPendingPayment(),
    buttons: [
      getPaymentButton(updatedState),
      getMarketWebLinkButton(ctx.state.marketId.toString()),
      <Button action="post" target="/pendingPayment">
        Refresh 🔄
      </Button>,
      <Button action="post" target="/">
        Go home
      </Button>,
    ],
    imageOptions: {
      aspectRatio: "1:1",
    },
  };
});
