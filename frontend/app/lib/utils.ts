import { formatEther } from "viem";
import { BetDirection, MarketType, UserWasRight } from "../types";

export function convertMillisecondsToDelta(milliseconds: number): string {
    if (milliseconds < 0) {
        milliseconds = Math.abs(milliseconds);
    }

    var days, hours, minutes, seconds, total_hours, total_minutes, total_seconds;

    total_seconds = Math.floor(milliseconds / 1000);
    total_minutes = Math.floor(total_seconds / 60);
    total_hours = Math.floor(total_minutes / 60);
    days = Math.floor(total_hours / 24);

    seconds = Math.floor(total_seconds % 60);
    minutes = Math.floor(total_minutes % 60);
    hours = Math.floor(total_hours % 24);

    let timeString = '';
    if (days > 0) timeString += `${days} days, `;
    if (hours > 0) timeString += `${hours} hours, `;
    if (minutes > 0) timeString += `${minutes} minutes, `;
    if (seconds > 0 && !timeString) timeString += `${seconds} seconds`;
    return timeString.replace(/, $/, '');
};

const DEGEN_CONTRACT_MULTIPLIER = 1000000;
export const renderDegenPriceFromContract = (price: bigint): string => price ? `$${Number(formatEther(BigInt(price) * BigInt(DEGEN_CONTRACT_MULTIPLIER))).toFixed(8)}` : "TBD";

export const cn = (...classes: (string | boolean | undefined)[]): string => {
    return classes.filter(Boolean).join(' ');
}

export const getUserWasRight = (market: MarketType): boolean | undefined => {
    if (!market.isResolved) return undefined;

    const bet = market.bets?.[0];
    if (!bet) return undefined;

    const userDirection = bet.sharesHigher !== "0" ? BetDirection.HIGHER : BetDirection.LOWER;
    const didVoteBoth = bet.sharesHigher !== "0" && bet.sharesLower !== "0";
    return didVoteBoth || market.highWon === (userDirection === BetDirection.HIGHER);
}