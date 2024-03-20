import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { ContextProvider } from "./ContextProvider";


export const metadata: Metadata = {
  title: "degen steaks 🥩 - a prediction market for degens",
  description: "🔥🥩",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ContextProvider>
        {children}
    </ContextProvider>
  );
}
