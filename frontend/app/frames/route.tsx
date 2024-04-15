import { Button } from "frames.js/next";
import { frames } from "./frames";
import { getImageForMarket, getProgressbarFromMarketData, renderMarketMainButton } from "../components/FrameUI";
import { formatEther } from "viem";
import { getDefaultOpenMarket, getMarket } from "../lib/indexerUtils";
import { getMaxMultiplierForMarket } from "../lib/utils";
import { MarketType } from "../types";

const handleRequest = frames(async (ctx: any) => {
  console.log("handleRequest mainRoute.tsx", ctx);
  const marketIdFromSearchParams = ctx.searchParams?.marketId as string;
  let market: MarketType;
  if (marketIdFromSearchParams) {
    market = await getMarket(marketIdFromSearchParams, []);
  } else {
    market = await getDefaultOpenMarket([]);
  }
  const maxMultiplier = getMaxMultiplierForMarket(market);

  return {
    image: getImageForMarket({ market, showPastBets: false })
    // (
    //   <div tw="flex flex-col w-3/4 self-center text-center justify-center items-center">
    //     <div tw="flex flex-col self-center text-center justify-center items-center">
    //       <p tw="text-7xl font-bold tracking-tight text-gray-900">
    //         Want to get more out of your $DEGEN?
    //       </p>
    //       <p tw="text-5xl">Steak it and earn today!</p>
    //     </div>
    //     <div tw="flex w-full">{getProgressbarFromMarketData(marketData)}</div>
    //     <div tw="flex flex-col mt-24 items-center">
    //       <p tw="text-5xl">
    //         {formatEther(BigInt(marketData.degenCollected))} $DEGEN steaked
    //       </p>
    //       <p tw="text-5xl -mt-6">in latest market</p>
    //       {maxMultiplier && (
    //         <p tw="text-5xl">
    //           🔥 max potential return {maxMultiplier.toFixed(2)}% 🔥
    //         </p>
    //       )}
    //     </div>
    //   </div>
    // )
    ,
    buttons: [
      renderMarketMainButton({ market }),
      <Button key="learnMore" action="post" target="/learnMore">
        Learn More ➡️
      </Button>,
      <Button key="viewMarket" action="post" target="/viewMarket">
        Latest market 🥩
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
