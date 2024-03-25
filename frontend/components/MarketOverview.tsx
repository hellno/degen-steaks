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
  // console.log("hash", hash, "isPending", isPending, "isSuccess", isSuccess, "status", status, "error", error)
  useEffect(() => {
    getDegenUsdPrice().then((price) => {
      setCurrentPrice(price);
    });
  }, []);

  if (!market) return null;

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

  const renderResolveButton = () => isConnected ? (
    <Button variant="secondary" size="lg" onClick={() => onResolveMarket()}>
      {isPending ? "Resolve market..." : "Resolve market"}
    </Button>
  ) : <ConnectButton accountStatus="avatar" />;

  const getBetSize = (bet: BetType) => {
    const shares = bet.sharesHigher > 0 ? bet.sharesHigher : bet.sharesLower;
    const betSize = Number(shares / allShares * market.degenCollected).toFixed(2);
    return betSize;
  }
  const renderUserBets = () => (
    <div className="flex flex-col gap-2">
      {market.bets &&
        market.bets.map((bet) => (
          <div key={bet.id} className="flex flex-col gap-2">
            <span className="text-2xl text-gray-600">
              {bet.sharesHigher > 0 ? "Higher" : "Lower"}
            </span>
            <span className="text-xl text-gray-600 truncate">
              {getBetSize(bet)}{" "}
              $DEGEN
            </span>
          </div>
        ))}
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
          {/* <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Latest DEGEN steaks 🔥🥩 bet
          </h2> */}
          <p className="text-lg leading-8 text-gray-800">
            {timeDelta < 0 ? "This market is closed." : ""}{" "}
            {timeDelta < 0 && !market?.bets?.length
              ? "Place your bets below"
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
          {currentPrice && renderData(
            "Current price",
            `$${currentPrice}`
          )}
          {renderData(
            "start time",
            new Date(market.startTime * 1000).toString().split("(")[0] || ""
          )}
          {renderData(
            "DEGEN steaked",
            formatEther(BigInt(market.degenCollected)).toString()
          )}
          {renderData("Market ID", market.id.toString())}
          {market?.bets?.length
            ? renderData("Your bet", renderUserBets())
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
