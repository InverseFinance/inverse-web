import useSWR from 'swr';
import { NetworkIds } from '@app/types';
import { BigNumber, Contract } from 'ethers';
import { ERC20_ABI } from '@app/config/abis';
import { isAddress } from '@ethersproject/address';
import { getBnToNumber } from '@app/util/markets';
import { JsonRpcProvider } from '@ethersproject/providers';
import { parseUnits } from '@ethersproject/units';

export default function useSpecificChainBalance(
    account: string | null | undefined,
    token: string,
    chainId: NetworkIds,
): { balance: number, decimals: number, bnBalance: BigNumber } {
    const { data } = useSWR(`${token}-${chainId}-bal-${account}`, async () => {
        const provider = getPublicRpcProvider(chainId);
        if (account && isAddress(account) && !!provider) {
            const contract = new Contract(token, ERC20_ABI, provider);
            const decimals = getBnToNumber(await contract.decimals(), 0);
            return { decimals, value: (await contract.balanceOf(account)).toString() };
        }
        return null;
    })

    return {
        decimals: data ? data?.decimals : 18,
        balance: data ? getBnToNumber(data?.value, data?.decimals) : 0,
        bnBalance: data ? parseUnits(data?.value, 0) : BigNumber.from('0'),
    }
}

export const getPublicRpcProvider = (chainId: NetworkIds) => {
    if(chainId === NetworkIds.mainnet) {
        return new JsonRpcProvider('https://eth.llamarpc.com');
    }
    else if (chainId === NetworkIds.ftm) {
        return new JsonRpcProvider('https://rpc.ftm.tools/');
    }
    else if (chainId === NetworkIds.optimism) {
        return new JsonRpcProvider('https://rpc.ankr.com/optimism');
    }
    else if (chainId === NetworkIds.bsc) {
        return new JsonRpcProvider('https://bsc-dataseed3.binance.org');
    }
    else if (chainId === NetworkIds.arbitrum) {
        return new JsonRpcProvider('https://arb1.arbitrum.io/rpc');
    }
    else if (chainId === NetworkIds.polygon) {
        return new JsonRpcProvider('https://polygon.llamarpc.com');
    }
    else if (chainId === NetworkIds.avalanche) {
        return new JsonRpcProvider('https://rpc.ankr.com/avalanche');
    }
    else if (chainId === NetworkIds.base) {
        return new JsonRpcProvider('https://mainnet.base.org');
    }
    return null;
}