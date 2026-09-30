import useSWR from 'swr';
import { fetcher } from '@app/util/web3';
import { formatMerklUserRewards, getMerklFirmUserRewardsUrl, MerklClaimable } from '@app/util/merkl';

// user rewards from all FiRM Merkl incentives (claims on Merkl are per token, not per market)
export const useMerklFirmRewards = (account?: string): {
    claimables: MerklClaimable[]
    isLoading: boolean
    error: any
} => {
    const { data, error } = useSWR(account ? getMerklFirmUserRewardsUrl(account) : '-', fetcher);
    return {
        claimables: account ? formatMerklUserRewards(data) : [],
        isLoading: !!account && !data && !error,
        error,
    };
}
