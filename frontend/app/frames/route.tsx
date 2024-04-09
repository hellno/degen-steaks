import { Button } from "frames.js/next";
import { frames } from "./frames";

const handleRequest = frames(async (ctx) => {
  // if (!ctx?.message?.isValid) {
  //   throw new Error("Invalid Frame");
  // }

  // get latest market here

  return {
    image: (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl font-bold tracking-tight text-gray-900">
            Want to get more out of your $DEGEN?
          </p>
          <p tw="text-5xl">Start steaking and earn today!</p>
        </div>
        {/* <div tw="flex">{renderProgressBar({ a: 69, b: 31 })}</div> */}
      </div>
    ),
    buttons: [
      <Button
        key="viewMarket"
        action="post"
        target={{ pathname: "/viewMarket", query: { foo: "bar" } }}
      >
        Start 🥩🔥
      </Button>,
      <Button key="learnMore" action="post" target="/learnMore">
        Learn More ➡️
      </Button>,
    ],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
