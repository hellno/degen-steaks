import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
 
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
})
