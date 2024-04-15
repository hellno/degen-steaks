import { DEFAULT_MARKET_ID } from "../frames/frames";
import { MarketType } from "../types";
import { getDefaultOpenMarket, getMarket } from "./indexerUtils";

export const getUserAddressesFromContext = (ctx: any) => {
    if (!ctx || !ctx.message) {
        return [];
    }
    const { requesterCustodyAddress, requesterVerifiedAddresses } = ctx?.message;
    const userAddresses = ([requesterCustodyAddress] || []).concat(
        requesterVerifiedAddresses
    );
    return userAddresses;
}

export const getMarketDataFromContext = async (ctx: any) => {
    const marketIdFromQuery = ctx.searchParams?.marketId;
    const resetMarketId = ctx.searchParams?.resetMarketId === 'true';
    const { marketId } = ctx.state;
    const userAddresses = getUserAddressesFromContext(ctx);

    let market: MarketType;
    if (!resetMarketId && marketIdFromQuery) {
        market = await getMarket(marketIdFromQuery, userAddresses);
    } else if (resetMarketId || marketId === DEFAULT_MARKET_ID) {
        market = await getDefaultOpenMarket(userAddresses);
    } else {
        market = await getMarket(marketId.toString(), userAddresses);
    }
    return market;
}