import { MarketData } from "./types";

export const getLatestMarketId = (): number => {
    // fetch from indexer
    return 0;
}

export const getMarketData = async (marketId: number): Promise<MarketData> => {
    // fetch from indexer
    return {
        marketId: 1,
        above: 24,
        below: 76,
        threshold: 1200000000000000n,
        resolveTimestamp: 1708721917,
        result: "above",
    }
}

export const getUserDataForMarket = async (marketId: number): Promise<any> => {
    // fetch from indexer
    return {
        userAddress: "0x1234",
        voted: "above",
        balance: 1000000000000000000n,
    }
}