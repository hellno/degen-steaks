type Result = "above" | "below" | "tbd" | "invalid";

export type MarketData = {
    marketId: number;
    above: number;
    below: number;
    threshold: bigint;
    resolveTimestamp: number; // unix timestamp
    result: Result;
};