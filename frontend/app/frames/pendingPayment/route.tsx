/* eslint-disable react/jsx-key */
import { frames } from "../frames";
import { Button } from "frames.js/next";
 
export const POST = frames(async (ctx) => {
  const foo = ctx.searchParams.foo;
 
  return {
    image: <div tw="flex">Route 1 foo: {foo}</div>, // foo: bar
    buttons: [
      <Button action="post" target="/">
        Go home
      </Button>,
    ],
  };
});