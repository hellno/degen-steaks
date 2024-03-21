import { degenAbi, degenContractAddress } from "../const/degenAbi"
import { betRegistryAddress } from "../const/betRegistryAbi"
import { publicClient } from "../viemClient"

const getDegenAllowanceForAddress = async (address: string): Promise<bigint> => {
    if (!address || !address.startsWith('0x')) {
        return 0n;
    }
    
    try {
        return await publicClient.readContract({
            address: degenContractAddress,
            abi: degenAbi,
            functionName: 'allowance',
            args: [address as `0x${string}`, betRegistryAddress],
        })
    } catch (error) {
        return 0n;
    }
}

const hasAnyDegenAllowance = async (addresses: string[]): Promise<boolean> => {
    if (!addresses.length) {
        return false;
    }
    
    for (const address of addresses) {
        const allowance = await getDegenAllowanceForAddress(address);
        if (allowance > 0n) {
            return true;
        }
    }
    return false;
}

export { hasAnyDegenAllowance, getDegenAllowanceForAddress }