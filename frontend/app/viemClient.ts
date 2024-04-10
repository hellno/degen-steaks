import { Chain, PublicClient, Transport, createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

const chain = base;

export const baseHttp = http(
    `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  );

export const publicClient: PublicClient<Transport, Chain> = createPublicClient<Transport, Chain>({
    chain,
    transport: baseHttp,
})
