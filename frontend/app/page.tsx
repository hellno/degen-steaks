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
  renderDegenPriceFromContract,
} from "./lib/utils";
import { formatEther, parseEther } from "viem";

const DEFAULT_DEGEN_BETSIZE = "420690000000000000000";
const DEFAULT_MARKET_ID = -1;
const baseUrl =
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  process.env.NEXT_PUBLIC_HOST ||
  "http://localhost:3000";

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
    return {
      label: "Approve",
      action: "tx",
      target: `${baseUrl}/txdata/approvedegen`,
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
        ...frameMessage.requesterVerifiedAddresses,
      );
  if (marketId === DEFAULT_MARKET_ID) {
    marketData = await getDefaultOpenMarket(userAddresses);
    state.marketId = marketData.id;
  } else {
    marketData = await getMarket(marketId.toString(), userAddresses);
  }

  // console.log('inputText in state', pageState, ' ->>>>>', frameMessage?.inputText)
  // if (pageState === PageState.decide) {
  // }

  if (pageState === PageState.pending_payment) {
    if (state.hasAllowance === undefined) {
      state.hasAllowance = await hasAnyDegenAllowance(userAddresses);
    }
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

  const renderProgressBar = ({ a, b }: { a: number; b: number }) => (
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
            <div tw="flex justify-center items-center w-full font-bold text-gray-100">
              {a}%
            </div>
          ) : null}
        </div>
        <div
          tw={clsx(
            a ? "rounded-r-full" : "rounded-full",
            "flex w-full bg-red-500"
          )}
          style={{ width: `${a + b > 0 ? (b / (a + b)) * 100 : 0}%` }}
        >
          {b ? (
            <div tw="flex justify-center items-center w-full font-bold text-gray-100">
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
          <p tw="text-5xl">Start steaking and earn today!</p>
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
                Price was {renderDegenPriceFromContract(endPrice)}{" "}
                {renderDegenPriceFromContract(targetPrice)}-{">"}{" "}
                {highWon || "TBD"}
              </p>
              <p tw="text-6xl">You {userWasCorrect ? "won 🤩" : "lost 🫡"} </p>
            </div>
          </div>
        </FrameImage>
      );
    }

    const timeDelta = marketData.endTime * 1000 - new Date().getTime();
    const sharesLower =
      marketData.totalSharesLower /
      (marketData.totalSharesLower + marketData.totalSharesHigher);
    const sharesHigher =
      marketData.totalSharesHigher /
      (marketData.totalSharesLower + marketData.totalSharesHigher);
    console.log(
      "timeDelta",
      timeDelta,
      marketData.endTime,
      new Date().getTime()
    );

    const marketEndDescription =
      timeDelta > 0
        ? `Ends in ${convertMillisecondsToDelta(timeDelta)}`
        : `Ended ${convertMillisecondsToDelta(timeDelta)} ago`;

    return (
      <FrameImage aspectRatio="1:1">
        <div tw="flex flex-col">
          <div tw="flex flex-col self-center text-center justify-center items-center">
            <p tw="text-5xl">Will the $DEGEN price be</p>
            above 🔼 or below 🔽
            <p tw="text-7xl">
              {renderDegenPriceFromContract(BigInt(marketData.targetPrice))}
            </p>
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
              <p>1. Approve $DEGEN {!hasAllowance && youAreHere}</p>
              <p>2. Place bet {hasAllowance && youAreHere}</p>
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
  // console.log("generate buttons", await generateButtons());
  const renderButtons = async () =>
    (await generateButtons()).map((button, idx) =>
      renderButton(idx + 1, button)
    ) as any;

  const renderInput = () =>
    stateToInput[state.pageState] && (
      <FrameInput text={stateToInput[state.pageState].text} />
    );

  return (
    <div className="p-4">
      <h1 className="text-4xl">degen steaks 🥩</h1>
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        {renderImage()}
        {await renderButtons()}
        {renderInput()}
      </FrameContainer>
    </div>
  );
}
