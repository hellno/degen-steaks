"use client";
/* eslint-disable @next/next/no-img-element */

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { getDegenAllowance } from "../lib/onchainUtils";
import { Button } from "components/ui/button";
import { degenAbi, degenContractAddress } from "../const/degenAbi";
import { betRegistryAbi, betRegistryAddress } from "../const/betRegistryAbi";
import { getDefaultOpenMarket, getMarket } from "../lib/indexerUtils";
import MarketOverview from "@/components/MarketOverview";
import { BetDirection, MarketType } from "../types";
import { Input } from "@/components/ui/input";
import { formatEther, parseEther } from "viem";

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

const navigation = [
  { name: "FAQ", href: "#faq" },
  //   { name: "Features", href: "#" },
  //   { name: "Marketplace", href: "#" },
  //   { name: "Company", href: "#" },
];

const faqs = [
  {
    id: 1,
    question: "What happens to my $DEGEN when I bet?",
    answer:
      "It is transferred to the market contract and will be distributed to the winners after the market is resolved.",
  },
  {
    id: 2,
    question: "How do I know if I won?",
    answer:
      "The market will be resolved after the end time and you will be able to claim your winnings. If you bet on the winning side, you will receive a share of the losing side's bets.",
  },
  {
    id: 3,
    question: "What are the fees?",
    answer: "There is a 2% fee on all bets.",
  },
  {
    id: 4,
    question: "How do I resolve a market?",
    answer:
      "After the resolve time, anyone can call the resolve function on the market contract. This will distribute the winnings to the winners.",
  },
  {
    id: 5,
    question: "How do I create a market?",
    answer: "Markets are created by the team (for now). You can bet on any open market.",
  }
];

const MAX_ALLOWANCE = 10000;

enum State {
  start = "start",
  pending_bet = "pending_bet",
  view_market = "view_market",
}

const getMarketIdFromSlug = (slug: string[]): string | undefined => {
  if (slug[0] === "market" && slug.length > 1) {
    return slug[1];
  }
  return undefined;
}

export default function Page({ params }: { params: { slug: string[] } }) {
  const marketId = getMarketIdFromSlug(params.slug);
  const [pageState, setPageState] = useState<State>(State.view_market);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();

  const [betAmount, setBetAmount] = useState<number>(); // in user readable format
  const [market, setMarket] = useState<MarketType>();
  const [allowance, setAllowance] = useState<bigint>(0n); // in wei
  const [pendingAllowance, setPendingAllowance] = useState<number>();

  const {
    data: hash,
    isPending: isPendingWrite,
    isSuccess: isSuccessWrite,
    writeContract,
    status,
    error,
  } = useWriteContract();

  console.log('pageState', pageState);

  const updateAllowance = async () => {
    if (!address) return;

    getDegenAllowance([address]).then((allowance) => {
      setAllowance(allowance);
    });
  };

  const {
    status: transactionStatus,
    error: transactionError,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (pageState === State.start && status === "success") {
      updateAllowance();
      setPageState(State.pending_bet);
    } else if (pageState === State.pending_bet && status === "success") {
      setPageState(State.view_market);
    }
  }, [transactionStatus]);

  useEffect(() => {
    updateAllowance();
  }, [address, isSuccessWrite, error]);

  useEffect(() => {
    const addresses = address ? [address] : [];
    const updateToDefaultMarket = () => {
      getDefaultOpenMarket(addresses).then((market) => {
        setMarket(market);
      });
    }

    if (marketId) {
      getMarket(marketId, addresses).then((market) => {
        if (market) {
          setMarket(market);
        } else {
          updateToDefaultMarket();
        }
      });
    } else {
      updateToDefaultMarket();
    }
  }, [marketId, address]);

  useEffect(() => {
    if (allowance > 0n) {
      setPageState(State.pending_bet);
    }
  }, [allowance]);

  const onIncreaseAllowance = async () => {
    writeContract({
      abi: degenAbi,
      address: degenContractAddress,
      functionName: "approve",
      args: [
        betRegistryAddress,
        parseEther(pendingAllowance?.toString() || MAX_ALLOWANCE.toString()),
      ],
    });
  };

  const onPlaceBet = async (betDirection: BetDirection) => {
    if (!market?.id) return;

    const betSize = parseEther(
      betAmount?.toString() || MAX_ALLOWANCE.toString()
    );
    writeContract({
      abi: betRegistryAbi,
      address: betRegistryAddress,
      functionName: "placeBet",
      args: [BigInt(market.id), betSize, Number(betDirection)],
    });
  };

  const getHumanReadableAllowance = () =>
    Number(formatEther(allowance)).toFixed(6);

  const renderAllowanceForm = () =>
    pageState === State.start && (
      <div className="flex flex-col gap-4">
        <div className="flex">
          <Input
            placeholder={`Allowance`}
            type="number"
            value={pendingAllowance}
            onChange={(e) => setPendingAllowance(e.target.value)}
          />
          <Button
            size="lg"
            className="ml-3 h-12"
            variant="outline"
            onClick={() => setPendingAllowance(MAX_ALLOWANCE)}
          >
            Max
          </Button>
        </div>
        <div className="flex flex-col gap-y-4">
          <Button
            size="lg"
            onClick={() => onIncreaseAllowance()}
            disabled={isPendingWrite}
          >
            {isPendingWrite ? "Approving..." : "Approve 🔥"}
          </Button>
          {allowance > 0n && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => setPageState(State.pending_bet)}
            >
              Start betting
            </Button>
          )}
        </div>
      </div>
    );
    
  const renderShareView = () => {
    const intentUrl = `https://warpcast.com/~/compose?text=just%20steaked%20some%20%24DEGEN%20%F0%9F%A5%A9%F0%9F%94%A5&embeds[]=${baseUrl}/market/1`;

    return pageState === State.view_market && (
      <div className="flex flex-col gap-4">
        <Button size="lg" onClick={() => window.open(intentUrl, '_blank')}>
          Share on Warpcast
        </Button>
      </div>
    );
  };

  const renderPlaceBetForm = () =>
    pageState === State.pending_bet && (
      <div className="flex flex-col gap-4">
        <div className="flex">
          <Input
            placeholder={`Bet amount (max: ${getHumanReadableAllowance()})`}
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
          <Button
            size="lg"
            className="ml-3 h-12"
            variant="outline"
            onClick={() => setBetAmount(Number(formatEther(allowance)))}
          >
            Max
          </Button>
        </div>
        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={() => onPlaceBet(BetDirection.LOWER)}
            disabled={isPendingWrite}
          >
            {isPendingWrite ? "Placing bet..." : "Place bet 🔽"}
          </Button>
          <Button
            size="lg"
            onClick={() => onPlaceBet(BetDirection.HIGHER)}
            disabled={isPendingWrite}
          >
            {isPendingWrite ? "Placing bet..." : "Place bet 🔼"}
          </Button>
        </div>
        <div>
          <Button size="default" variant="outline" onClick={() => setPageState(State.start)}>
            Increase allowance
          </Button>
        </div>
      </div>
    );

  const renderCtaButtons = () => {
    return (
      <div className="mt-10 flex items-center justify-center gap-x-6">
        {!isConnected && <ConnectButton />}
        {renderAllowanceForm()}
        {renderPlaceBetForm()}
        {renderShareView()}
      </div>
    );
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          className="flex items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <div className="-m-1.5 p-1.5">
              <span className="sr-only">Degen Steaks</span>
              <span className="text-5xl font-bold tracking-tight text-gray-900">
                🥩🔥
              </span>
            </div>
          </div>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden lg:flex lg:gap-x-12 lg:mr-12">
            <span className="text-sm font-semibold leading-6 text-gray-900">
              Base x Degen x Prediction Market
            </span>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <ConnectButton accountStatus="avatar" />
          </div>
        </nav>
        <Dialog
          as="div"
          className="lg:hidden"
          open={mobileMenuOpen}
          onClose={setMobileMenuOpen}
        >
          <div className="fixed inset-0 z-50" />
          <Dialog.Panel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
              <a href="#" className="-m-1.5 p-1.5">
                <span className="sr-only">Degen Steaks</span>
                <span className="text-5xl font-bold tracking-tight text-gray-900">
                  🥩🔥
                </span>
              </a>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex gap-x-12 mt-4">
              <span className="text-sm font-semibold leading-6 text-gray-900">
                Base x Degen x Prediction Market
              </span>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      </header>

      <main className="isolate">
        {/* Hero section */}
        <div className="relative pt-14">
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
          <div className="py-16 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Want to earn more $DEGEN?
                </h1>
                <p className="mt-2 lg:mt-6 text-lg leading-8 text-gray-600">
                  Degen Steaks is Base x Degen x Prediction Market
                </p>
                {renderCtaButtons()}
              </div>
              <div className="mt-2 lg:mt-4 text-center mx-auto max-w-sm">
                <a
                  href="https://warpcast.com/~/channel/degen-steaks"
                  className="text-sm font-normal leading-6 text-gray-500 hover:underline hover:text-gray-800"
                >
                  Visit /degen-steaks channel <span aria-hidden="true">→</span>
                </a>
              </div>
              <MarketOverview market={market} />
              {/* App Screenshot */}
              {/* <div className="mt-16 flow-root sm:mt-24">
                <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                  <img
                    src="https://tailwindui.com/img/component-images/project-app-screenshot.png"
                    alt="App screenshot"
                    width={2432}
                    height={1442}
                    className="rounded-md shadow-2xl ring-1 ring-gray-900/10"
                  />
                </div>
              </div> */}
            </div>
          </div>
          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#c20151] to-[#d52842] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
            />
          </div>
        </div>

        {/* Testimonial section */}
        <div className="mx-auto mt-12 max-w-7xl sm:mt-56 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gray-900 px-6 py-20 shadow-xl sm:rounded-3xl sm:px-10 sm:py-24 md:px-12 lg:px-20">
            <img
              className="absolute inset-0 h-full w-full object-cover brightness-150 saturate-0"
              src="https://images.unsplash.com/photo-1588182657969-777d766e31ab?ixid=MXwxMjA3fDB8MHxwcm9maWxlLXBhZ2V8ODl8fHxlbnwwfHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1216&q=80"
              alt=""
            />
            <div className="absolute inset-0 bg-gray-900/90 mix-blend-multiply" />
            <div
              className="absolute -left-80 -top-56 transform-gpu blur-3xl"
              aria-hidden="true"
            >
              <div
                className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-r from-[#ff4694] to-[rgb(213,20,20)] opacity-[0.45]"
                style={{
                  clipPath:
                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                }}
              />
            </div>
            <div
              className="hidden md:absolute md:bottom-16 md:left-[50rem] md:block md:transform-gpu md:blur-3xl"
              aria-hidden="true"
            >
              <div
                className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-r from-[#ff4694] to-[#776fff] opacity-25"
                style={{
                  clipPath:
                    "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                }}
              />
            </div>
            <div className="relative mx-auto max-w-2xl lg:mx-0">
              <span className="text-2xl text-white">(🥩, 🔥)</span>
              <figure>
                <blockquote className="mt-6 text-lg font-semibold text-white sm:text-xl sm:leading-8">
                  <p>“I like making memes”</p>
                </blockquote>
                <figcaption className="mt-6 text-base text-white">
                  <div className="font-semibold">hellno.eth</div>
                  <div className="mt-1">Optimist, DEGEN and Steaker</div>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mx-auto max-w-2xl divide-y divide-gray-900/10 px-6 pb-8 sm:pb-24 sm:pt-12 lg:max-w-7xl lg:px-8 lg:pb-32">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-8 divide-y divide-gray-900/10">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8"
              >
                <dt className="text-base font-semibold leading-7 text-gray-900 lg:col-span-5">
                  {faq.question}
                </dt>
                <dd className="mt-4 lg:col-span-7 lg:mt-0">
                  <p className="text-base leading-7 text-gray-600">
                    {faq.answer}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* CTA section */}
        <div className="relative -z-10 mt-32 px-6 lg:px-8">
          <div
            className="absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 transform-gpu justify-center overflow-hidden blur-3xl sm:bottom-0 sm:right-[calc(50%-6rem)] sm:top-auto sm:translate-y-0 sm:transform-gpu sm:justify-end"
            aria-hidden="true"
          >
            <div
              className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#ff80b5] to-[#9089fc] opacity-25"
              style={{
                clipPath:
                  "polygon(73.6% 48.6%, 91.7% 88.5%, 100% 53.9%, 97.4% 18.1%, 92.5% 15.4%, 75.7% 36.3%, 55.3% 52.8%, 46.5% 50.9%, 45% 37.4%, 50.3% 13.1%, 21.3% 36.2%, 0.1% 0.1%, 5.4% 49.1%, 21.4% 36.4%, 58.9% 100%, 73.6% 48.6%)",
              }}
            />
          </div>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get more out of your $DEGEN
              <br />
              Start using DEGEN steaks 🔥🥩 today.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Incididunt sint fugiat pariatur cupidatat consectetur sit cillum
              anim id veniam aliqua proident excepteur commodo do ea.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
