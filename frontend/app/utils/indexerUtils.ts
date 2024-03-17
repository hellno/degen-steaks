import { request, gql, Variables } from "graphql-request"
import { BetType, MarketType } from "../types";
import get from 'lodash.get';

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;

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
    }
`

const runGraphqlRequest = async (query: string, variables: Variables, key: string) => {
    const response = await request(GRAPHQL_ENDPOINT, query, variables);
    // console.log('response', response);
    return get(response, key);
}

const getDefaultOpenMarket = async (addresses: string[] = []): Promise<MarketType> => {
    const query = gql`
        ${MARKET_FRAGMENT}
        ${BET_FRAGMENT}
        query Market ($addresses: [String!]) {
            Market (where: {isResolved: {_eq: false}}, order_by: {betCount: desc}, limit: 1) {
                ...MarketFragment
                bets (where:{user_id:{_in: $addresses}}) {
                    ...BetFragment
                }
            }

        }
    `;
    const vars = { addresses };
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

const getMarket = async (marketId: number, addresses: string[] = []): Promise<MarketType> => {
    const query = gql`
        ${MARKET_FRAGMENT}
        ${BET_FRAGMENT}
        query Market ($marketId: String!, $addresses: [String!]) {
            Market (where : {id: {_eq: $marketId}}) {
            ...MarketFragment
                bets (where:{user_id:{_in: $addresses}}) {
                    ...BetFragment
                }
            }
        }
    `;
    const vars = { marketId, addresses };
    return (await runGraphqlRequest(query, vars, 'Market'))?.[0] as MarketType;
}

export { getActiveMarkets, getDefaultOpenMarket, getMarket };