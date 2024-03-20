import {
  convertMillisecondsToDelta,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { MarketType } from "@/app/types";
import MarketBetRatioBar from "./MarketBetRatioBar";
import { formatEther } from "viem";
import { Button } from "./ui/button";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { betRegistryAbi, betRegistryAddress } from "@/app/const/betRegistryAbi";

const MarketOverview = ({ market }: { market: MarketType | undefined }) => {
  const {
    data: hash,
    isPending,
    isSuccess,
    writeContract,
    status,
    error,
  } = useWriteContract();
  console.log("MarketOverview", market, status, error);
  if (!market) return null;

  const timeDelta = market.endTime * 1000 - new Date().getTime();
  const marketEndDescription =  
    timeDelta > 0
      ? `ends in ${convertMillisecondsToDelta(timeDelta)}.`
      : `ended ${convertMillisecondsToDelta(timeDelta)} ago.`;

  const sharesLower =
    market.totalSharesLower /
    (market.totalSharesLower + market.totalSharesHigher);
  const sharesHigher =
    market.totalSharesHigher /
    (market.totalSharesLower + market.totalSharesHigher);

  const renderData = (label: string, value: string | React.ReactNode) => (
    <div className="flex flex-col bg-gray-400/5 p-8">
      {label && (
        <dt className="text-sm font-semibold leading-6 text-gray-600">
          {label}
        </dt>
      )}
      <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 break-all">
        {value}
      </dd>
    </div>
  );

  const onResolveMarket = () => {
    writeContract({
      abi: betRegistryAbi,
      address: betRegistryAddress,
      functionName: "resolveMarket",
      args: [BigInt(market.id)],
    });
  };

  const renderResolveButton = () => (
    <Button variant="secondary" size="lg" onClick={() => onResolveMarket()}>
      {isPending ? "Resolve market..." : "Resolve market"}
    </Button>
  );

  const renderUserBets = () => (
    <div className="flex flex-col gap-2">
      {market.bets.map((bet) => (
        <div key={bet.id} className="flex flex-col gap-2">
          <span className="text-2xl text-gray-600">
            {bet.sharesHigher ? "Higher" : "Lower"}
          </span>
          <span className="text-xl text-gray-600 truncate">
            {Number(formatEther(BigInt(bet.sharesHigher ? bet.sharesHigher : bet.sharesLower)).toString()).toFixed(2)} shares
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-12 mx-auto max-w-7xl px-2 lg:px-8">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <div className="text-center">
          {/* <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Latest DEGEN steaks 🔥🥩 bet
          </h2> */}
          <p className="text-lg leading-8 text-gray-800">
            {timeDelta < 0 ? "This market is closed" : "Place your bets below"}.
            {' '}
            The bet{' '}{marketEndDescription}
          </p>
        </div>
        <div className="mt-4 max-w-lg mx-auto">
          <MarketBetRatioBar
            lower={100 * Number(sharesLower)}
            higher={100 * Number(sharesHigher)}
          />
        </div>
        <dl className="mt-8 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-3">
          {renderData(
            "ends at",
            new Date(market.endTime * 1000).toString().split("(")[0] || ""
          )}
          {renderData(
            "Who won?",
            market.isResolved ? (market.highWon ? "Higher 🔼" : "Lower 🔽") : "TBD"
          )}
          {renderData(
            "Threshold price",
            renderDegenPriceFromContract(market.targetPrice)
          )}
          {renderData(
            "started at",
            new Date(market.startTime * 1000).toString().split("(")[0] || ""
          )}
          {renderData(
            "DEGEN steaked",
            formatEther(BigInt(market.degenCollected)).toString()
          )}
          {renderData("Market ID", market.id.toString())}
          {market?.bets?.length ? renderData("Your bet", renderUserBets()) : null}
          {!market.isResolved && timeDelta < 0 && renderData("", renderResolveButton())}
        </dl>
      </div>
    </div>
  );
};

export default MarketOverview;
