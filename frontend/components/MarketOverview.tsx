import {
  convertMillisecondsToDelta,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "@/app/lib/utils";
import { BetType, MarketType } from "@/app/types";
import MarketBetRatioBar from "./MarketBetRatioBar";
import { formatEther, parseEther } from "viem";
import { Button } from "./ui/button";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { betRegistryAbi, betRegistryAddress } from "@/app/const/betRegistryAbi";
import { useEffect, useState } from "react";
import { getDegenUsdPrice } from "@/app/lib/dexScreener";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import clsx from "clsx";

const MarketOverview = ({ market }: { market: MarketType | undefined }) => {
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const {
    data: hash,
    isPending,
    isSuccess,
    writeContract,
    status,
    error,
  } = useWriteContract();

  useEffect(() => {
    getDegenUsdPrice().then((price) => {
      setCurrentPrice(price);
    });
  }, []);

  if (!market) return null;
  console.log("market", market);

  const timeDelta = market.endTime * 1000 - new Date().getTime();
  const marketEndDescription =
    timeDelta > 0
      ? `ends in ${convertMillisecondsToDelta(timeDelta)}.`
      : `ended ${convertMillisecondsToDelta(timeDelta)} ago.`;

  const allShares = market.totalSharesLower + market.totalSharesHigher;
  const sharesLower = market.totalSharesLower / allShares;
  const sharesHigher = market.totalSharesHigher / allShares;

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

  const renderResolveButton = () =>
    isConnected ? (
      <Button variant="secondary" size="lg" onClick={() => onResolveMarket()}>
        {isPending ? "Resolve market..." : "Resolve market"}
      </Button>
    ) : (
      <ConnectButton accountStatus="avatar" />
    );

  const getBetCurrentSteaks = (bet: BetType) => {
    let betSize;
    if (bet.sharesHigher > 0) {
      betSize =
        (bet.sharesHigher / market.totalSharesHigher) *
        market.totalSteakedDegen;
    } else {
      betSize =
        (bet.sharesLower / market.totalSharesLower) * market.totalSteakedDegen;
    }
    return BigInt(betSize);
  };

  const getBetPnlPercentage = (bet: BetType, currentSteaks: bigint): number => {
    if (!currentSteaks || !bet?.placedBets?.length) {
      return 0;
    }

    const paidInSteaks = bet.placedBets.reduce(
      (acc, placedBet) => acc + BigInt(placedBet.steaks),
      0n
    );

    const pnlRatio = Number((currentSteaks * 10000n) / paidInSteaks) / 10000;
    const pnlPercentage = (pnlRatio - 1) * 100;
    return pnlPercentage;
  };

  const renderUserBetDirection = () => {
    const bet = market.bets?.[0];
    if (!bet) {
      return "No bets placed";
    }

    let betDirection: string;
    if (bet.sharesHigher && bet.sharesLower) {
      betDirection = "Both directions";
    } else if (bet.sharesHigher) {
      betDirection = "Higher";
    } else {
      betDirection = "Lower";
    }
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <span className="text-2xl text-gray-900">{betDirection}</span>
        </div>
      </div>
    );
  };

  const renderUserDegenSteakAmount = () => (
    <div className="flex flex-col gap-2">
      {market.bets &&
        market.bets.map((bet) => {
          const currentSteaks = getBetCurrentSteaks(bet);
          const pnl = getBetPnlPercentage(bet, currentSteaks);

          return (
            <div key={bet.id} className="flex flex-col gap-2">
              <span className="text-2xl text-gray-900">
                {Number(formatEther(currentSteaks)).toFixed(4)} 🥩🥩🥩
              </span>
              <span
                className={clsx(
                  pnl >= 0 ? "font-semibold text-green-600" : "text-red-600",
                  "text-sm"
                )}
              >
                {pnl.toFixed(4)}%
              </span>
            </div>
          );
        })}
    </div>
  );

  const renderClaimButton = () => (
    <Button
      variant="secondary"
      className="mb-2"
      size="lg"
      onClick={() => {
        writeContract({
          abi: betRegistryAbi,
          address: betRegistryAddress,
          functionName: "cashOut",
          args: [BigInt(market.id)],
        });
      }}
    >
      {isPending ? "Claiming..." : "Claim"}
    </Button>
  );

  return (
    <div className="mt-12 mx-auto max-w-7xl px-2 lg:px-8">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <div className="text-center">
          <p className="text-lg leading-8 text-gray-800">
            {timeDelta < 0 ? "This market is closed." : ""}{" "}
            {timeDelta > 0 && !market?.bets?.length
              ? "Place your bets below."
              : ""}
            The bet {marketEndDescription}
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
            "closing time",
            new Date(market.endTime * 1000).toString().split("(")[0] || ""
          )}
          {renderData(
            "Who won?",
            market.isResolved
              ? market.highWon
                ? "Higher 🔼"
                : "Lower 🔽"
              : "TBD"
          )}
          {renderData(
            "Threshold price",
            renderDegenPriceFromContract(market.targetPrice)
          )}
          {currentPrice && renderData("Current price", `$${currentPrice}`)}
          {renderData(
            "start time",
            new Date(market.startTime * 1000).toString().split("(")[0] || ""
          )}
          {renderData(
            "DEGEN in pool",
            formatEther(BigInt(market.degenCollected)).toString()
          )}
          {renderData("Market ID", market.id.toString())}
          {market?.bets?.length
            ? renderData("Your bet", renderUserBetDirection())
            : null}
          {market?.bets?.length
            ? renderData("Your DEGEN steaks", renderUserDegenSteakAmount())
            : null}
          {market.isResolved &&
            getUserWasRight(market) &&
            renderData("Claim your winnings", renderClaimButton())}
          {!market.isResolved &&
            timeDelta < 0 &&
            renderData("", renderResolveButton())}
          {chainId === 84532 &&
            renderData(
              "get test degen",
              <Button
                onClick={() => {
                  writeContract({
                    abi: [
                      {
                        constant: true,
                        inputs: [
                          {
                            name: "shares",
                            type: "uint256",
                          },
                        ],
                        name: "mint",
                        outputs: [],
                        payable: false,
                        stateMutability: "view",
                        type: "function",
                      },
                    ],
                    address: "0x11efF3a7cbEBA2071105DD9b9DE02DefC8F95217",
                    functionName: "mint",
                    args: [parseEther("420.69")],
                  });
                }}
              >
                Mint
              </Button>
            )}
        </dl>
      </div>
    </div>
  );
};

export default MarketOverview;
