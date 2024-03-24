"use client";

import { getDefaultConfig, lightTheme, midnightTheme } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "@wagmi/core/chains";

export const CHAIN = baseSepolia; // base

export const config = getDefaultConfig({
    appName: "degen steaks 🥩",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [CHAIN],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });
  
  export const rainbowKitTheme = lightTheme({
    accentColor: "rgb(15 23 42)",
    accentColorForeground: "white",
    borderRadius: "medium",
    fontStack: "system",
    overlayBlur: "small",
  });
  