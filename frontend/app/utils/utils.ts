import { formatEther } from "viem";

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
    if (seconds > 0) timeString += `${seconds} seconds`;
    return timeString.replace(/, $/, '');
};

export const renderPrice = (price: bigint): string => price ? `$${formatEther(price)}` : "TBD";
