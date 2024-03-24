"use client";

import React from "react";
import clsx from "clsx";

const MarketBetRatioBar = ({ lower, higher }: { lower: number; higher: number }) => {
    if (!lower && !higher) return null;

    const lowerPercentage = ((lower / (lower + higher)) * 100);
    const higherPercentage = ((higher / (lower + higher)) * 100);
    return (
        <div className="flex justify-center lg:px-12">
            <div className="flex h-12 rounded-lg w-full">
                <div
                    className={clsx(
                        higher ? "rounded-l-full" : "rounded-full",
                        "flex border-gray-500 w-full bg-red-400"
                    )}
                    style={{ width: `${lower + higher > 0 ? (lower / (lower + higher)) * 100 : 0}%` }}
                >
                    {lower ? (
                        <div className="text-clip overflow-hidden flex justify-center items-center w-full font-bold text-white">
                            {lowerPercentage.toFixed(2)}% {lowerPercentage > 30 && "lower"}
                        </div>
                    ) : null}
                </div>
                <div
                    className={clsx(
                        lower ? "rounded-r-full" : "rounded-full",
                        "flex w-full bg-green-400"
                    )}
                    style={{ width: `${lower + higher > 0 ? (higher / (lower + higher)) * 100 : 0}%` }}
                >
                    {higher ? (
                        <div className="text-clip overflow-hidden flex justify-center items-center w-full font-bold text-white">
                            {higherPercentage.toFixed(2)}% {higherPercentage > 30 && "higher"}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default MarketBetRatioBar;
