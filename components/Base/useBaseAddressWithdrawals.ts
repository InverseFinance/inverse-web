import { NetworkIds } from "@app/types";
import { WithdrawalItem, getBaseAddressWithrawals } from "@app/util/base";
import { Web3Provider } from "@ethersproject/providers";
import useSWR from "swr"

export const useBaseAddressWithdrawals = (
    account: string | undefined,
    chainId: number | undefined,
    ethProvider: Web3Provider | undefined,
): {
    transactions: WithdrawalItem[],
    hasError: boolean,
    isLoading: boolean,
    error: any,
} => {
    const { data, error } = useSWR(`base-withdrawals-${account}-${chainId}`, async () => {
        if (!account || chainId?.toString() !== NetworkIds.mainnet || !ethProvider) return null;
        return await getBaseAddressWithrawals(ethProvider, account);
    });

    const hasError = !!error || !!data?.hasError;
    
    return {
        transactions: data?.results || [],
        hasError,
        error: data?.error || error,
        isLoading: !hasError && !data?.results,
    }
}