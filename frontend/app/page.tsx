import { NextServerPageProps } from "frames.js/next/server";

export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
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
    </div>
  );
}
