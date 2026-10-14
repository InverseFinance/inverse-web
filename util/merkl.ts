import { BigNumber } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';

// Merkl incentives for FiRM markets, docs: https://developers.merkl.xyz
export const MERKL_API_URL = 'https://api.merkl.xyz/v4';
export const MERKL_FIRM_PROTOCOL_ID = 'firm';

export type MerklOpportunity = {
    // too big for a js number, kept as a string by the api
    id: string
    chainId: number
    identifier: string
    explorerAddress?: string
    status: 'LIVE' | 'PAST' | 'SOON'
    action: string
    // in %
    apr: number
    // apr cap of the campaigns as a fraction (0.05 = 5%), 0 when not capped
    maxApr?: number | null
    // rewards distributed per day and the most that can be distributed per day, values in USD
    dailyRewards?: number
    maxDailyRewards?: number
    // unix timestamp in seconds, as a string
    latestCampaignEnd?: string
    // daily rewards per campaign, value in USD
    rewardsRecord?: {
        breakdowns?: {
            token?: { address: string, symbol: string, displaySymbol?: string, icon?: string }
            value?: number
        }[]
    }
}

export type MerklRewardToken = {
    address: string
    symbol: string
    icon: string | null
}

type MerklUserReward = {
    amount: string
    claimed: string
    pending: string
    token: { address: string, symbol: string, decimals: number, price?: number, icon?: string }
}

export type MerklClaimable = {
    address: string
    symbol: string
    image?: string
    price: number
    // claimable now
    balance: number
    balanceUSD: number
    // claimable after the next Merkl root update
    pending: number
    pendingUSD: number
    metaType: 'claimable'
}

export const getMerklUserUrl = (account: string) => `https://app.merkl.xyz/users/${account}`;

export const getMerklOpportunityUrl = (opportunityId: string) => `https://app.merkl.xyz/opportunities/${opportunityId}`;

export const getMerklFirmUserRewardsUrl = (account: string) => `${MERKL_API_URL}/users/${account}/protocols/${MERKL_FIRM_PROTOCOL_ID}/rewards?chainId=1`;

// live incentives of all FiRM markets, null if the Merkl api is unavailable
export const getMerklFirmOpportunities = async (): Promise<MerklOpportunity[] | null> => {
    try {
        const res = await fetch(
            `${MERKL_API_URL}/opportunities?type=FIRM_DEBT`,
            { signal: AbortSignal.timeout(10000) },
        );
        if (!res.ok) {
            throw new Error(`status ${res.status}`);
        }
        const opportunities = await res.json();
        return Array.isArray(opportunities) ? opportunities : null;
    } catch (e) {
        console.error('Merkl opportunities', e);
        return null;
    }
}

// sum of the valid positive values of a field of the opportunities
const sumField = (opportunities: MerklOpportunity[], field: 'apr' | 'maxApr' | 'dailyRewards' | 'maxDailyRewards') => {
    return opportunities.reduce((total, o) => {
        const value = o[field];
        return total + (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
}

// end of the last campaign, in ms
const getLatestCampaignEnd = (opportunities: MerklOpportunity[]) => {
    const ends = opportunities.map(o => Number(o.latestCampaignEnd) * 1000).filter(end => Number.isFinite(end) && end > 0);
    return ends.length > 0 ? Math.max(...ends) : null;
}

// tokens distributed by the campaigns, the one with the most daily rewards first
// page of the opportunity distributing the most rewards
const getMainOpportunityUrl = (opportunities: MerklOpportunity[]) => {
    const [main] = [...opportunities].sort((a, b) => (Number(b.dailyRewards) || 0) - (Number(a.dailyRewards) || 0));
    return main?.id ? getMerklOpportunityUrl(main.id) : null;
}

const getRewardTokens = (opportunities: MerklOpportunity[]): MerklRewardToken[] => {
    const rewardTokens: { [address: string]: { token: MerklRewardToken, value: number } } = {};
    opportunities.flatMap(o => o.rewardsRecord?.breakdowns || []).forEach(({ token, value }) => {
        if (!token?.address) {
            return;
        }
        const key = token.address.toLowerCase();
        rewardTokens[key] = {
            token: { address: token.address, symbol: token.displaySymbol || token.symbol, icon: token.icon || null },
            value: (rewardTokens[key]?.value || 0) + (Number.isFinite(value) ? Number(value) : 0),
        };
    });
    return Object.values(rewardTokens).sort((a, b) => b.value - a.value).map(({ token }) => token);
}

// active incentives of a FiRM market, the opportunity targets the market contract
export const getMerklMarketIncentives = (marketAddress: string, opportunities: MerklOpportunity[]) => {
    const address = marketAddress.toLowerCase();
    const marketOpportunities = opportunities.filter(o => {
        return o.chainId === 1 && o.status === 'LIVE' && [o.identifier, o.explorerAddress].some(a => a?.toLowerCase() === address);
    });
    const collateralOpportunities = marketOpportunities.filter(o => o.action !== 'BORROW');
    const borrowOpportunities = marketOpportunities.filter(o => o.action === 'BORROW');
    return {
        hasMerklRewards: marketOpportunities.length > 0,
        // collateral incentives, apr on the deposits
        merklApy: sumField(collateralOpportunities, 'apr'),
        // borrowing incentives (eg FIRM_DEBT campaigns), apr on the DOLA debt
        merklBorrowApr: sumField(borrowOpportunities, 'apr'),
        // apr caps in %, 0 when the campaigns are not capped
        merklMaxApy: sumField(collateralOpportunities, 'maxApr') * 100,
        merklBorrowMaxApr: sumField(borrowOpportunities, 'maxApr') * 100,
        // rewards distributed per day by all the live campaigns and the most they can distribute per day, in USD
        merklDailyRewards: sumField(marketOpportunities, 'dailyRewards'),
        merklMaxDailyRewards: sumField(marketOpportunities, 'maxDailyRewards'),
        // when the last live Merkl campaign of the market ends
        merklCampaignEndTimestamp: getLatestCampaignEnd(marketOpportunities),
        merklRewardTokens: getRewardTokens(marketOpportunities),
        // Merkl page of the main live opportunity
        merklUrl: getMainOpportunityUrl(marketOpportunities),
    };
}

// response of the user protocol rewards endpoint: [{ chain, rewards }]
export const formatMerklUserRewards = (data: any): MerklClaimable[] => {
    const rewards: MerklUserReward[] = (Array.isArray(data) ? data : []).find(c => c?.chain?.id === 1)?.rewards || [];
    return rewards.map(r => {
        const { address, symbol, decimals, price, icon } = r.token;
        // amount is cumulative, what was already claimed is in claimed
        const balance = parseFloat(formatUnits(BigNumber.from(r.amount).sub(r.claimed), decimals));
        const pending = parseFloat(formatUnits(BigNumber.from(r.pending), decimals));
        return {
            address,
            symbol,
            image: icon || undefined,
            price: price || 0,
            balance,
            balanceUSD: balance * (price || 0),
            pending,
            pendingUSD: pending * (price || 0),
            metaType: 'claimable' as const,
        };
    }).filter(r => r.balance > 0 || r.pending > 0);
}
