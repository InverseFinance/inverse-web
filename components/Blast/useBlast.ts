import { NetworkIds } from "@app/types";
import { L2_TOKEN_ABI, WithdrawalItem, getBlastAddressWithrawals, getBlastProvider } from "@app/util/blast";
import { Web3Provider } from "@ethersproject/providers";
import { Contract } from "ethers";
import useSWR from "swr"

export const useBlastAddressWithdrawals = (
    account: string | undefined,
    chainId: number | undefined,
    ethProvider: Web3Provider | undefined,
    refreshIndex = 0,
): {
    transactions: WithdrawalItem[],
    hasError: boolean,
    isLoading: boolean,
    error: any,
} => {
    const { data, error } = useSWR(`blast-withdrawals-${account}-${chainId}-${refreshIndex}`, async () => {
        if (!account || chainId?.toString() !== NetworkIds.mainnet || !ethProvider) return null;
        return await getBlastAddressWithrawals(ethProvider, account);
    });

    const hasError = !!error || !!data?.hasError;

    return {
        transactions: data?.results || [],
        hasError,
        error: data?.error || error,
        isLoading: !hasError && !data?.results,
    }
}

export const useBlastToken = (
    adOnL2: string,
) => {
    const blastProvider = getBlastProvider()!;

    const { data, error } = useSWR(`blast-token-${adOnL2}`, async () => {
        if (!adOnL2) return null;
        const L2TokenContract = new Contract(adOnL2, L2_TOKEN_ABI, blastProvider);
        return await Promise.all([
            L2TokenContract.decimals(),
            L2TokenContract.symbol(),
            L2TokenContract.l1Token(),
        ]);
    });

    const [decimals, symbol, l1Token] = data || [18, '', ''];
    return {
        decimals,
        symbol,
        l1Token,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}