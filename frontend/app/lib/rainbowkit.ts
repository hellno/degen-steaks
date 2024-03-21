"use client";

import { getDefaultConfig, midnightTheme } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "@wagmi/core/chains";

export const config = getDefaultConfig({
    appName: "degen steaks 🥩",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    // chains: [base],
    chains: [baseSepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });
  
  export const rainbowKitTheme = midnightTheme({
    accentColorForeground: "white",
    borderRadius: "small",
    fontStack: "system",
  });
  