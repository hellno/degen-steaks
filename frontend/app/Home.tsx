import {
  FrameButton,
  FrameContainer,
  FrameImage, NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer
} from "frames.js/next/server";
import { formatEther } from "viem";
import clsx from "clsx";
import { convertMillisecondsToDelta, renderDegenPriceFromContract } from "./lib/utils";
import { getMarket, getDefaultOpenMarket } from "./lib/indexerUtils";
import { MarketType } from "./types";
import isFunction from "lodash.isfunction";
import { State, reducer, initialState, DEFAULT_MARKET_ID, PageState, stateToButtons } from "./page";


export default async function Home({
  params, searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);
  const [state] = useFramesReducer<State>(reducer, initialState, previousFrame);
  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    // hubHttpUrl: '',
    fetchHubContext: true,
  });

  console.log("page state", state);
  console.log("frameMessage", frameMessage);
  const { marketId, pageState } = state;

  let marketData: MarketType;

  const userAddresses = !frameMessage
    ? []
    : [frameMessage.requesterCustodyAddress].concat(
      ...frameMessage.requesterVerifiedAddresses
    );
  if (marketId === DEFAULT_MARKET_ID) {
    marketData = await getDefaultOpenMarket(userAddresses);
    state.marketId = marketData.id;
  } else {
    marketData = await getMarket(marketId, userAddresses);
  }

  if (pageState === PageState.pending_payment) {
    // check if user made a payment
    console.log("pending payment");
  }

  if (pageState === PageState.view_market) {
    console.log("pending view market");
  }

  const renderImage = () => {
    switch (pageState) {
      case PageState.start:
        return renderDefaultFrame();
      case PageState.decide:
      case PageState.view_market:
        return renderFrameForMarket();
      case PageState.pending_payment:
        return renderPaymentInstructionFrame();
      default:
        return renderDefaultFrame();
    }
  };

  const renderProgressBar = ({ a, b }: { a: number; b: number; }) => (
    <div tw="flex justify-center px-12">
      <div tw="flex h-24 rounded-lg">
        <div
          tw={clsx(
            b ? "rounded-l-full" : "rounded-full",
            "flex border-gray-500 w-full bg-green-400"
          )}
          style={{ width: `${a + b > 0 ? (a / (a + b)) * 100 : 0}%` }}
        >
          {a ? (
            <div tw="flex justify-center items-center w-full font-bold text-white">
              {a}%
            </div>
          ) : null}
        </div>
        <div
          tw={clsx(
            a ? "rounded-r-full" : "rounded-full",
            "flex w-full bg-red-400"
          )}
          style={{ width: `${a + b > 0 ? (b / (a + b)) * 100 : 0}%` }}
        >
          {b ? (
            <div tw="flex justify-center items-center w-full font-bold text-white">
              {b}%
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderDefaultFrame = () => (
    <FrameImage aspectRatio="1:1">
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">Want more $DEGEN?</p>
          <p tw="text-5xl">Start staking and betting today!</p>
        </div>
        <div tw="flex">{renderProgressBar({ a: 69, b: 21 })}</div>
      </div>
    </FrameImage>
  );

  const renderFrameForMarket = () => {
    const { isResolved, endPrice, targetPrice, highWon, bets } = marketData;
    console.log("renderFrameForMarket", marketData);
    if (isResolved && endPrice) {
      const userPlacedBet = bets && bets.length > 0;
      const userWasCorrect = false;

      return (
        <FrameImage aspectRatio="1:1">
          <div tw="flex flex-col">
            <div tw="flex flex-col self-center text-center justify-center items-center">
              <p tw="text-7xl">DEGEN steak is done 🔥🧑🏽‍🍳</p>
              <p tw="text-5xl">
                Price was {renderDegenPriceFromContract(endPrice)} {renderDegenPriceFromContract(targetPrice)}-
                {">"} {highWon || "TBD"}
              </p>
              <p tw="text-6xl">You {userWasCorrect ? "won 🤩" : "lost 🫡"} </p>
            </div>
          </div>
        </FrameImage>
      );
    }

    const timeDelta = marketData.endTime * 1000 - new Date().getTime();
    const sharesLower = marketData.totalSharesLower /
      (marketData.totalSharesLower + marketData.totalSharesHigher);
    const sharesHigher = marketData.totalSharesHigher /
      (marketData.totalSharesLower + marketData.totalSharesHigher);

    const marketEndDescription = timeDelta > 0
      ? `Ends in ${convertMillisecondsToDelta(timeDelta)}`
      : `Ended ${convertMillisecondsToDelta(timeDelta)} ago`;

    return (
      <FrameImage aspectRatio="1:1">
        <div tw="flex flex-col">
          <div tw="flex flex-col self-center text-center justify-center items-center">
            <p tw="text-5xl">Will the $DEGEN price be</p>
            above 🔼 or below 🔽
            <p tw="text-7xl">{formatEther(marketData.targetPrice)}</p>
            {marketEndDescription}
            <div tw="flex mt-24">
              {renderProgressBar({
                a: 100 * Number(sharesLower),
                b: 100 * Number(sharesHigher),
              })}
            </div>
          </div>
        </div>
      </FrameImage>
    );
  };

  const renderPaymentInstructionFrame = () => (
    <FrameImage aspectRatio="1:1">
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">Pending Payment</p>
          <p tw="text-5xl">Place your bet to continue:</p>
          <div tw="flex flex-col text-5xl">
            <p>1. Approve $DEGEN</p>
            <p>2. Place bet</p>
          </div>
        </div>
      </div>
    </FrameImage>
  );

  const generateButtons = async () => {
    const buttons = stateToButtons[state.pageState];
    return await Promise.resolve(
      Promise.all(
        buttons.map(async (button) => isFunction(button) ? button(frameMessage) : button
        ) as any
      )
    );
  };

  const renderButton = (idx: number, button: any) => (
    <FrameButton
      action={button.action}
      target={button.target}
      key={idx}
    >
      {button.label}
    </FrameButton>
  );
  console.log('marketData', marketData);
  console.log("generate buttons", await generateButtons());
  const renderButtons = async () => (await generateButtons()).map((button, idx) => renderButton(idx + 1, button)
  ) as any;

  return (
    <div>
      <h1 className="text-4xl">degen steaks 🥩 - {pageState}</h1>
      <a href="/web" className="text-lg mt-4 underline">use web app ↗️</a>
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        {renderImage()}
        {await renderButtons()}
      </FrameContainer>
    </div>
  );
}
