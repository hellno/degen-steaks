import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameReducer,
  NextServerPageProps,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import {
  getLatestMarketId,
  getMarketData,
  getUserDataForMarket,
} from "./onchainUtils";
import { formatEther } from "viem";
import clsx from "clsx";
import { convertMillisecondsToDelta, renderPrice } from "./utils";

enum PageState {
  start = "start",
  decide = "decide",
  pending_payment = "pending_payment",
  view_market = "view_market",
}

const stateToButtons: { [key in PageState]: string[] } = {
  [PageState.start]: ["Start 🔥"],
  [PageState.decide]: ["Below 🔽", "Above 🔼"],
  [PageState.pending_payment]: ["Pay ↗️", "Refresh", "Back to start"],
  [PageState.view_market]: ["Refresh", "Back to start"],
};

type State = {
  pageState: PageState;
  marketId: number;
};

const initialState: State = { pageState: PageState.start, marketId: 0 };

const reducer: FrameReducer<State> = (state, action) => {
  const buttonIndex = action.postBody?.untrustedData.buttonIndex;
  console.log("buttonIndex", buttonIndex);
  if (!state.marketId) {
    state = { ...state, marketId: getLatestMarketId() };
  }

  if (state.pageState === PageState.start) {
    return { ...state, pageState: PageState.decide };
  }

  if (state.pageState === PageState.decide) {
    return { ...state, pageState: PageState.pending_payment };
  }

  if (state.pageState === PageState.pending_payment) {
    if (buttonIndex === 1) {
      // stay on page, because we are pending payment
      // action should link out to payment page and not trigger this
      return { ...state, pageState: PageState.pending_payment };
    }
    if (buttonIndex === 2) {
      // refresh
      return { ...state, pageState: PageState.view_market };
    }
    if (buttonIndex === 3) {
      return { ...state, pageState: PageState.start };
    }
  }

  if (state.pageState === PageState.view_market) {
    if (buttonIndex === 1) {
      return { ...state, pageState: PageState.view_market };
    }
    if (buttonIndex === 2) {
      return { ...state, pageState: PageState.start };
    }
  }
  return state;
};

export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);
  const [state] = useFramesReducer<State>(reducer, initialState, previousFrame);
  console.log("state", state);
  const marketData = await getMarketData(state.marketId);
  // fake the data for now
  if (state.pageState !== PageState.view_market) {
    marketData.resolveTimestamp = new Date().getTime() + 300000;
  }

  console.log("marketData", marketData);
  const userData = await getUserDataForMarket(state.marketId);
  if (state.pageState === PageState.pending_payment) {
    // check if user made a payment
  }

  if (state.pageState === PageState.view_market) {
    // check if user has won or lost
  }

  const renderImage = () => {
    switch (state.pageState) {
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

  const renderButtons = () => {
    const buttons = stateToButtons[state.pageState];
    if (!buttons) {
      return <FrameButton>something went wrong</FrameButton>;
    }

    return buttons.map((label, index) => (
      <FrameButton key={index}>{label}</FrameButton>
    ));
  };

  const renderProgressBar = ({ a, b }: { a: number; b: number }) => (
    <div tw="flex justify-center px-12">
      <div tw="flex h-24 rounded-lg">
        <div
          tw={clsx(
            b ? "rounded-l-full" : "rounded-full",
            "flex border-r-5 border-gray-500 w-full bg-green-400"
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
    <FrameImage>
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">Want more $DEGEN?</p>
          <p tw="text-5xl">Start staking and betting today! 🥩</p>
        </div>
        <div tw="flex">{renderProgressBar({ a: 69, b: 21 })}</div>
      </div>
    </FrameImage>
  );

  // use Market data to render progress bar and threshold
  const renderFrameForMarket = () => {
    const timeDelta = marketData.resolveTimestamp - new Date().getTime();
    if (timeDelta < 0) {
      const userWasCorrect = userData.voted === marketData.result;
      return (
        <FrameImage>
          <div tw="flex flex-col">
            <div tw="flex flex-col self-center text-center justify-center items-center">
              <p tw="text-7xl">$DEGEN is cooked 🧑🏽‍🍳</p>
              <p tw="text-5xl">
                Price was {marketData.result}{" "}
                {renderPrice(marketData.threshold)}
              </p>
              <p tw="text-6xl">You {userWasCorrect ? "won" : "lost"} </p>
            </div>
          </div>
        </FrameImage>
      );
    }

    return (
      <FrameImage>
        <div tw="flex flex-col">
          <div tw="flex flex-col space-y-2 self-center text-center justify-center items-center">
            <p tw="text-4xl">Will the $DEGEN price be</p>
            above or below
            <p tw="text-4xl">{formatEther(marketData.threshold)}</p>
            in {convertMillisecondsToDelta(timeDelta)}?
            <div tw="flex">
              {renderProgressBar({ a: marketData.above, b: marketData.below })}
            </div>
          </div>
        </div>
      </FrameImage>
    );
  };

  const renderPaymentInstructionFrame = () => (
    <FrameImage>
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">Pending Payment</p>
          <p tw="text-5xl">Please pay to continue</p>
        </div>
      </div>
    </FrameImage>
  );

  return (
    <div>
      Multi-page example <Link href="/debug">Debug</Link>
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        {renderImage()}
        {renderButtons()}
      </FrameContainer>
    </div>
  );
}
