export type MarketType = {
    id: number;
    isResolved: boolean;
    endPrice: bigint;
    totalDegen: bigint;
    highWon: boolean;
    totalSharesHigher: bigint;
    totalSharesLower: bigint;
    totalSteakedDegen: bigint;
    startTime: number;
    endTime: number;
    degenCollected: bigint;
    targetPrice: bigint;
    bets?: BetType[];
};

export type BetType = {
    id: number;
    sharesHigher: bigint;
    sharesLower: bigint;
    cashedOut: boolean;
    cashedOutDegen: bigint;
    cashOutTransaction: string;
}

export enum BetDirection {
    HIGHER = 0,
    LOWER = 1,
}

export enum UserWasRight {
    UNKNOWN = 0,
    YES = 1,
    NO = 2,
}
