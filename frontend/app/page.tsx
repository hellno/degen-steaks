import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import clsx from "clsx";
import { BetDirection, MarketType } from "./types";
import isFunction from "lodash.isfunction";
import { hasAnyDegenAllowance } from "./lib/onchainUtils";
import { getDefaultOpenMarket, getMarket } from "./lib/indexerUtils";
import {
  convertMillisecondsToDelta,
  getUserWasRight,
  renderDegenPriceFromContract,
} from "./lib/utils";
import { formatEther, parseEther } from "viem";
import { fetchMetadata } from "frames.js/next";

const DEFAULT_DEGEN_BETSIZE = "420690000000000000000";
const DEFAULT_MARKET_ID = -1;
const baseUrl =
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  process.env.NEXT_PUBLIC_HOST ||
  "http://localhost:3000";

export async function generateMetadata() {
  return {
    title: "Degen Steaks",
    // provide a full URL to your /frames endpoint
    other: await fetchMetadata(new URL("/frames", baseUrl)),
  };
}

enum PageState {
  start = "start",
  decide = "decide",
  pending_payment = "pending_payment",
  view_market = "view_market",
}

const renderPaymentButton = async (state: State): Promise<any> => {
  if (state.hasAllowance) {
    const { marketId, betSize, betDirection } = state;
    return {
      label: "Place bet",
      action: "tx",
      target: `${baseUrl}/txdata/placebet?marketId=${marketId}&betSize=${betSize}&betDirection=${betDirection}`,
    };
  } else {
    const { betSize } = state;
    return {
      label: "Approve",
      action: "tx",
      target: `${baseUrl}/txdata/approvedegen?approvalAmount=${betSize}`,
    };
  }
};

const renderMarketWebLinkButton = async (state: State): Promise<any> => {
  return {
    label: "Web",
    action: "link",
    target: `${baseUrl}/web/market/${state.marketId}`,
  };
};

const stateToInput: { [key in PageState]: any } = {
  [PageState.start]: {},
  [PageState.decide]: {
    text: `Default: ${formatEther(BigInt(DEFAULT_DEGEN_BETSIZE))} $DEGEN`,
  },
  [PageState.pending_payment]: {},
  [PageState.view_market]: {},
};

const stateToButtons: { [key in PageState]: any[] } = {
  [PageState.start]: [{ label: "Start 🥩🔥" }],
  [PageState.decide]: [{ label: "Below 🔽" }, { label: "Above 🔼" }],
  [PageState.pending_payment]: [
    renderPaymentButton,
    { label: "Refresh 🔄" },
    renderMarketWebLinkButton,
    { label: "Back 🏠" },
  ],
  [PageState.view_market]: [{ label: "Refresh 🔄" }, { label: "Back 🏠" }],
};

type State = {
  pageState: PageState;
  marketId: number;
  hasAllowance?: boolean;
  betSize?: string;
  betDirection?: BetDirection;
};

const initialState: State = {
  pageState: PageState.start,
  marketId: DEFAULT_MARKET_ID,
  hasAllowance: undefined,
};

const reducer: FrameReducer<State> = (state, action) => {
  // console.log("reducer state", state);
  const buttonIndex = action.postBody?.untrustedData.buttonIndex;
  console.log("buttonIndex", buttonIndex);
  if (!state.marketId) {
    console.log("has no market id");
    state = { ...state, marketId: 3 };
  }

  if (state.pageState === PageState.start) {
    return { ...state, pageState: PageState.decide };
  }

  if (state.pageState === PageState.decide) {
    const inputText = action.postBody?.untrustedData?.inputText;
    console.log("decide state", state);
    const betSize = (
      inputText ? parseEther(inputText) : DEFAULT_DEGEN_BETSIZE
    ).toString();
    const betDirection =
      buttonIndex === 1 ? BetDirection.LOWER : BetDirection.HIGHER;
    return {
      ...state,
      pageState: PageState.pending_payment,
      betSize,
      betDirection,
    };
  }

  if (state.pageState === PageState.pending_payment) {
    if (buttonIndex === 1) {
      console.log("bet onchain");
      return { ...state, pageState: PageState.pending_payment };
    }
    if (buttonIndex === 2) {
      // refresh
      return { ...state, pageState: PageState.pending_payment };
    }
    // buttonIndex === 3 -> link to webapp
    if (buttonIndex === 4) {
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
  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    // hubHttpUrl: '',
    fetchHubContext: true,
  });
  const [state] = useFramesReducer<State>(reducer, initialState, previousFrame);

  console.log("page state", state);
  console.log("frameMessage", frameMessage);
  const { marketId, pageState } = state;

  let marketData: MarketType;

  const userAddresses = !frameMessage
    ? []
    : [frameMessage.requesterCustodyAddress].concat(
        ...frameMessage.requesterVerifiedAddresses
      );
  // if (marketId === DEFAULT_MARKET_ID) {
  //   marketData = await getDefaultOpenMarket(userAddresses);
  //   state.marketId = marketData.id;
  // } else {
  //   marketData = await getMarket(marketId.toString(), userAddresses);
  // }

  if (pageState === PageState.pending_payment) {
    if (!state.hasAllowance) {
      state.hasAllowance = await hasAnyDegenAllowance(userAddresses);
    }
  }

  if (marketData.bets && marketData.bets.length) {
    state.pageState = PageState.view_market;
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

  const renderDefaultFrame = () => (
    <FrameImage aspectRatio="1:1">
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl font-bold tracking-tight text-gray-900">
            Want to get more out of your $DEGEN?
          </p>
          <p tw="text-5xl">Start steaking and earn today!</p>
        </div>
        <div tw="flex">{renderProgressBar({ a: 69, b: 31 })}</div>
      </div>
    </FrameImage>
  );

  const renderPaymentInstructionFrame = () => {
    const { hasAllowance, betSize, betDirection } = state;
    const youAreHere = " ← You are here";
    return (
      <FrameImage aspectRatio="1:1">
        <div tw="flex flex-col">
          <div tw="flex flex-col self-center text-center justify-center items-center">
            <p tw="text-7xl">Two steps to </p>
            <p tw="text-7xl">start steaking your $DEGEN</p>
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
                {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}{" "}
                on{" "}
              </span>
              <span>
                {new Date(marketData.endTime * 1000).toString().split("(")[0] ||
                  ""}
              </span>
              <span tw="mt-4">
                You lose your funds if you bet on the wrong side! 🤯
              </span>
              <span tw="mt-4">Refresh to check allowance or bet status</span>
            </div>
          ) : null}
        </div>
      </FrameImage>
    );
  };

  const generateButtons = async () => {
    const buttons = stateToButtons[state.pageState];
    return await Promise.resolve(
      Promise.all(
        buttons.map(async (button) =>
          isFunction(button) ? button(state) : button
        ) as any
      )
    );
  };

  const renderButton = (idx: number, button: any) => (
    <FrameButton action={button.action} target={button.target} key={idx}>
      {button.label}
    </FrameButton>
  );

  const renderButtons = async () =>
    (await generateButtons()).map((button, idx) =>
      renderButton(idx + 1, button)
    ) as any;

  const renderInput = () =>
    stateToInput[state.pageState] && (
      <FrameInput text={stateToInput[state.pageState].text} />
    );

  console.log("marketData", marketData);

  return (
    <div className="p-4">
      <h1 className="text-4xl">degen steaks 🥩🔥</h1>
      <h2 className="text-2xl text-gray-500">
        Base x DEGEN x Prediction Market
      </h2>
      <div className="flex flex-col gap-y-4 mt-12">
        <p className="text-2xl">
          <a className="underline" href="/web/market/1">
            Web access to the markets ↗️
          </a>
        </p>
        <p className="text-2xl">
          <a
            className="underline"
            href="https://zora.co/collect/base:0xb5935092048f55d61226ec10b72b30e81818b811/1"
          >
            Zora Early Access NFT ↗️
          </a>
        </p>
      </div>
      {/* <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        {renderImage()}
        {await renderButtons()}
        {renderInput()}
      </FrameContainer> */}
    </div>
  );
}
