import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import { formatEther } from "viem";
import clsx from "clsx";
import { convertMillisecondsToDelta, renderPrice } from "./utils/utils";
import { getMarket, getDefaultOpenMarket } from "./utils/indexerUtils";
import { MarketType } from "./types";
import isFunction from "lodash.isfunction";
import { publicClient } from "./viemClient";
import { degenAbi, degenContractAddress } from "./const/degenAbi";
import { steakContractAddress } from "./const/steakAbi";
import { getDegenAllowance } from "./utils/onchainUtils";

const DEFAULT_MARKET_ID = -1;
const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

enum PageState {
  start = "start",
  decide = "decide",
  pending_payment = "pending_payment",
  view_market = "view_market",
}

const renderPaymentButton = async (data: any): Promise<any> => {
  const addresses = [data.requesterCustodyAddress].concat(
    ...data.requesterVerifiedAddresses
  );
  const allowance = await getDegenAllowance(addresses);
  const hasAllowance = allowance > 0n;

  if (hasAllowance) {
    return {
      label: "Approve $DEGEN",
      action: "tx",
      target: `${baseUrl}/txdata/approvedegen`,
    };
  } else {
    return {
      label: "Start betting",
      action: "tx",
      target: `${baseUrl}/txdata/placebet`,
    };
  }
};

const stateToButtons: { [key in PageState]: any[] } = {
  [PageState.start]: [{ label: "Start 🔥" }],
  [PageState.decide]: [{ label: "Below 🔽" }, { label: "Above 🔼" }],
  [PageState.pending_payment]: [
    renderPaymentButton,
    { label: "Refresh 🔄" },
    { label: "Back 🏠" },
  ],
  [PageState.view_market]: [{ label: "Refresh 🔄" }, { label: "Back 🏠" }],
};

type State = {
  pageState: PageState;
  marketId: number;
};

const initialState: State = {
  pageState: PageState.start,
  marketId: DEFAULT_MARKET_ID,
};

const reducer: FrameReducer<State> = (state, action) => {
  console.log("reducer state", state);
  const buttonIndex = action.postBody?.untrustedData.buttonIndex;
  console.log("buttonIndex", buttonIndex);
  if (!state.marketId) {
    console.log("has no market id");
    state = { ...state, marketId: 1 };
  }

  if (state.pageState === PageState.start) {
    return { ...state, pageState: PageState.decide };
  }

  if (state.pageState === PageState.decide) {
    return { ...state, pageState: PageState.pending_payment };
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
  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    // hubHttpUrl: '',
    fetchHubContext: true,
  });

  console.log("page state", state);
  // console.log("frameMessage", frameMessage);
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
        <FrameImage>
          <div tw="flex flex-col">
            <div tw="flex flex-col self-center text-center justify-center items-center">
              <p tw="text-7xl">DEGEN steak is done 🔥🧑🏽‍🍳</p>
              <p tw="text-5xl">
                Price was {renderPrice(endPrice)} {renderPrice(targetPrice)}-
                {">"} {highWon || "TBD"}
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
      <FrameImage>
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
    <FrameImage>
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">Pending Payment</p>
          <p tw="text-5xl">Please pay to continue</p>
        </div>
      </div>
    </FrameImage>
  );

  const generateButtons = async () => {
    const buttons = stateToButtons[state.pageState];
    return await Promise.resolve(
      Promise.all(
        buttons.map(async (button) =>
          isFunction(button) ? button(frameMessage) : button
        ) as any
      )
    );
  };

  const renderButton = (idx: number, button: any) => (
    <FrameButton
      action={button.action ? button.action : "post"}
      target={button.target}
      key={idx}
    >
      {button.label}
    </FrameButton>
  );

  console.log("generate buttons", await generateButtons());
  const renderButtons = async () =>
    (await generateButtons()).map((button, idx) =>
      renderButton(idx + 1, button)
    );

  return (
    <div>
      yo
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
