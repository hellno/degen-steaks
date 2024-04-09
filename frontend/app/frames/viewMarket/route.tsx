/* eslint-disable react/jsx-key */
import { frames } from "../frames";
import { Button } from "frames.js/next";

const handleRequest = frames(async (ctx) => {
  const currentState = ctx.state;

  // Update the state
  const updatedState = {
    ...currentState,
  };

  return {
    image: <div tw="flex">Count: yo`</div>,
    buttons: [<Button action="post">Refresh</Button>],
    state: updatedState,
  };
});

export const POST = handleRequest;
