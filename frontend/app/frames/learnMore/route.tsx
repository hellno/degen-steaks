/* eslint-disable react/jsx-key */
import { baseUrl, frames } from "../frames";
import { Button } from "frames.js/next";

export const POST = frames(async (ctx) => {
  return {
    image: (
      <div tw="flex flex-col">
        <div tw="flex flex-col self-center text-center justify-center items-center">
          <p tw="text-7xl">What is $DEGEN Steaks?</p>
          <p tw="flex flex-col text-5xl max-w-3/4">
            a decentralized staking platform that allows you to earn rewards on
            your $DEGEN holdings.
          </p>
          <p tw="flex flex-col text-5xl max-w-3/4">
            Place a bet on the direction of the market and earn rewards on your
            $DEGEN holdings.
          </p>
          <p tw="flex flex-col text-5xl max-w-3/4 text-red-600">
            Be aware: you can lose your $DEGEN if you bet wrong.
          </p>
        </div>
      </div>
    ),
    buttons: [
      <Button action="post" target="/">
        Home 🏠
      </Button>,
      // link to FAQ
      <Button action="link" target={`${baseUrl}/web/market/0#faq`}>
        FAQ
      </Button>,
    ],
    imageOptions: {
      aspectRatio: "1:1",
    },
  };
});
