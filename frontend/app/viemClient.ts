import { Chain, PublicClient, Transport, createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'

const chain = (process.env.NODE_ENV === 'production') ? base : baseSepolia;

export const publicClient: PublicClient<Transport, Chain> = createPublicClient<Transport, Chain>({
    chain,
    transport: http()
})
