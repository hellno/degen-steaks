import { Button } from "frames.js/next";
import { DEFAULT_MARKET_ID, frames } from "./frames";
import {
  getProgressBar,
  getProgressbarFromMarketData,
} from "../components/FrameUI";
import { formatEther } from "viem";
import { getDefaultOpenMarket } from "../lib/indexerUtils";

const handleRequest = frames(async () => {
  const marketData = await getDefaultOpenMarket([]);

  return {
    image: (
      <div tw="flex flex-col w-3/4 self-center text-center justify-center items-center">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl font-bold tracking-tight text-gray-900">
            Want to get more out of your $DEGEN?
          </p>
          <p tw="text-5xl">Steak it and earn today!</p>
        </div>
        <div tw="flex w-2/3">{getProgressBar({ a: 69, b: 31 })}</div>
        <div tw="flex flex-col mt-24 items-center">
          <p tw="text-5xl">
            {formatEther(BigInt(marketData.degenCollected))} $DEGEN steaked
          </p>
          <p tw="text-5xl -mt-6">in latest market</p>
        </div>
      </div>
    ),
    buttons: [
      <Button key="viewMarket" action="post" target="/decide">
        Start 🥩🔥
      </Button>,
      <Button key="learnMore" action="post" target="/learnMore">
        Learn More ➡️
      </Button>,
      <Button key="viewMarket" action="post" target="/viewMarket">
        Latest market
      </Button>,
    ],
    imageOptions: {
      aspectRatio: "1:1",
    },
    headers: {
      // Max cache age in seconds
      // update every 5mins
      "Cache-Control": "max-age=300",
    },
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
