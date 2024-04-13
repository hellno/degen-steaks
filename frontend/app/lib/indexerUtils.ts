import { request, gql, Variables } from "graphql-request"
import { BetType, MarketType } from "../types";
import get from 'lodash.get';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

const MARKET_FRAGMENT = gql`
    fragment MarketFragment on Market {
        id
        isResolved
        endPrice
        totalDegen
        highWon
        totalSharesHigher
        totalSharesLower
        totalSteakedDegen
        startTime
        endTime
		degenCollected
        targetPrice
    }
`;

const BET_FRAGMENT = gql`
    fragment BetFragment on Bet {
        id
        sharesHigher
        sharesLower
        cashedOut
        cashedOutDegen
        cashOutTransaction
        placedBets {
            id
            feeSteaks
            degen
            steaks
            betShares
            transaction
        }
    }
`

const runGraphqlRequest = async (query: string, variables: Variables, key: string) => {
    // console.log('graphql request', query, variables, GRAPHQL_ENDPOINT);
    const response = await request(GRAPHQL_ENDPOINT!, query, variables);
    // console.log('graphql response', response);
    return get(response, key);
}

const getDefaultOpenMarket = async (addresses: string[] = []): Promise<MarketType> => {
    const query = gql`
        ${MARKET_FRAGMENT}
        ${BET_FRAGMENT}
        query Market {
            Market (where: {isResolved: {_eq: false}}, order_by: {endTime: desc}, limit: 1) {
                ...MarketFragment
                bets ${getBetsConditionForAddresses(addresses)} {
                    ...BetFragment
                }
            }

        }
    `;
    const vars = {};
    return (await runGraphqlRequest(query, vars, 'Market'))?.[0] as MarketType;
}

const getActiveMarkets = async ({ limit, offset }: { limit: number, offset: number }): Promise<MarketType[]> => {
    const query = gql`
        ${MARKET_FRAGMENT}
        query Market {
            Market {
            ...MarketFragment
            }
      }`;
    return await runGraphqlRequest(query, {}, 'Market') as MarketType[];
};

const getBetsConditionForAddresses = (addresses: string[]): string => {
    let betsCondition;
    if (addresses.length <= 1) {
        betsCondition = `(where: {user_id: {_ilike: "${addresses?.[0] || ''}"}})`;
    } else {
        betsCondition = `(where: {_or: [${addresses.map((address) => `{user_id: {_ilike: "${address}"}}`).join(',')}]})`;
    }
    return betsCondition;
};

const getMarket = async (marketId: string, addresses: string[] = []): Promise<MarketType> => {
    console.log('getMarket', marketId, addresses)

    const query = gql`
        ${MARKET_FRAGMENT}
        ${BET_FRAGMENT}
        query Market ($marketId: String!) {
            Market (where : {id: {_eq: $marketId}}) {
            ...MarketFragment
                bets ${getBetsConditionForAddresses(addresses)} {
                    ...BetFragment
                }
            }
        }
    `;
    const vars = { marketId };
    return (await runGraphqlRequest(query, vars, 'Market'))?.[0] as MarketType;
}

export { getActiveMarkets, getDefaultOpenMarket, getMarket };