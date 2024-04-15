/* eslint-disable react/jsx-key */
import { frames, DEFAULT_DEGEN_BETSIZE, DEFAULT_MARKET_ID } from "../frames";
import { Button } from "frames.js/next";
import { BetDirection } from "@/app/types";
import { formatEther } from "viem";
import {
  getImageForMarket,
} from "@/app/components/FrameUI";
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

  const market = await getMarketDataFromContext(ctx);
  const timeDelta = market?.endTime
    ? market.endTime * 1000 - new Date().getTime()
    : 0;
  const hasEnded = timeDelta < 0;

  const updatedState = {
    ...currentState,
    marketId: market?.id || DEFAULT_MARKET_ID,
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
    image: getImageForMarket({ market: market, showPastBets: false }),
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
