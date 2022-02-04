import useSWR from 'swr';
import { getProvider } from '@app/util/providers';
import { NetworkIds } from '@app/types';
import { Contract } from 'ethers';
import { getNetworkConfig } from '@app/util/networks';
import { INV_ABI } from '@app/config/abis';
import { isAddress } from '@ethersproject/address';
import { getBnToNumber, getRewardToken } from '@app/util/markets';

const fantomProvider = getProvider(NetworkIds.ftm)
const ftmConfig = getNetworkConfig(NetworkIds.ftm, false)!;
const invFtmContract = new Contract(ftmConfig?.INV, INV_ABI, fantomProvider);

export default function useFantomBalance(address: string | null | undefined): { inv: number } {

    const { data } = useSWR(`inv-bal-on-fantom-${address}`, async () => {
        if(address && isAddress(address)) {
            return getBnToNumber(await invFtmContract.balanceOf(address), getRewardToken()!.decimals);
        }
        return 0
    })

    return {
        inv: data || 0
    }
}