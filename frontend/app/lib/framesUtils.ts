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
    // console.log('ctx.state', ctx.state)
    const marketIdFromQuery = ctx.searchParams.marketId;
    const { marketId } = ctx.state;
    const userAddresses = getUserAddressesFromContext(ctx);

    let marketData: MarketType;
    if (marketIdFromQuery) {
        marketData = await getMarket(marketIdFromQuery, userAddresses);
    } else if (marketId === DEFAULT_MARKET_ID) {
        marketData = await getDefaultOpenMarket(userAddresses);
    } else {
        marketData = await getMarket(marketId.toString(), userAddresses);
    }
    return marketData;
}