import { degenAbi, degenContractAddress } from "../const/degenAbi"
import { betRegistryAddress } from "../const/betRegistryAbi"
import { publicClient } from "../viemClient"

const getDegenAllowance = async (addresses: `0x${string}`[]): Promise<bigint> => {
    if (addresses.length < 1) {
        return 0n;
    }
    const allowance = await publicClient.readContract({
        address: degenContractAddress,
        abi: degenAbi,
        functionName: 'allowance',
        args: [addresses[0]!, betRegistryAddress],
    })

    return allowance;
}

export { getDegenAllowance }