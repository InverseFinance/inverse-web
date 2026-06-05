import { useMemo } from 'react';
import { Event } from 'ethers';
import useEtherSWR from '@app/hooks/useEtherSWR';
import { useMultiContractEvents } from '@app/hooks/useContractEvents';
import { useBlocksTimestamps } from '@app/hooks/useBlockTimestamp';
import { INVERSE_FOUNDATION_FUNDER_ABI, ERC20_ABI } from '@app/config/abis';
import { INVERSE_FOUNDATION_FUNDER } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets';
import { useAccount } from '@app/hooks/misc';

const { TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const QUARTER_DURATION = 90 * 24 * 3600;

const formatInterval = (seconds: number): string => {
    const days = Math.round(seconds / 86400);
    if (days >= 90) return `${Math.round(days / 30)} months`;
    if (days >= 1) return `${days} day${days !== 1 ? 's' : ''}`;
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
};

export const useFoundation = () => {
    const account = useAccount();

    // Step 1: Fetch all events
    const { groupedEvents, isLoading: isLoadingEvents } = useMultiContractEvents([
        [INVERSE_FOUNDATION_FUNDER, INVERSE_FOUNDATION_FUNDER_ABI, 'QuarterlyLimitSet', []],
        [INVERSE_FOUNDATION_FUNDER, INVERSE_FOUNDATION_FUNDER_ABI, 'DelegateSet', []],
        [INVERSE_FOUNDATION_FUNDER, INVERSE_FOUNDATION_FUNDER_ABI, 'FundsPulled', []],
    ], 'foundation-events');

    const [quarterlyEvents, delegateEvents, pullEvents] = groupedEvents;

    // Step 2: Extract unique token addresses from QuarterlyLimitSet events
    const uniqueTokens = useMemo(() => {
        if (!quarterlyEvents?.length) return [];
        const seen = new Set<string>();
        return quarterlyEvents
            .filter((e: Event) => {
                const addr = e.args?.token?.toLowerCase();
                if (!addr || seen.has(addr)) return false;
                seen.add(addr);
                return true;
            })
            .map((e: Event) => e.args!.token as string);
    }, [quarterlyEvents]);

    // Step 3: Extract active delegates from DelegateSet events
    const activeDelegateKeys = useMemo(() => {
        if (!delegateEvents?.length) return [];
        const delegateMap = new Map<string, Event>();
        [...delegateEvents]
            .sort((a, b) => a.blockNumber - b.blockNumber)
            .forEach((e: Event) => {
                const key = `${e.args!.delegate.toLowerCase()}-${e.args!.token.toLowerCase()}`;
                delegateMap.set(key, e);
            });
        return [...delegateMap.values()]
            .filter(e => !e.args!.limitAmount.isZero())
            .map(e => ({
                delegate: e.args!.delegate as string,
                token: e.args!.token as string,
            }));
    }, [delegateEvents]);

    // Step 4: Fetch on-chain state
    const staticCalls = [
        [INVERSE_FOUNDATION_FUNDER, 'gov'],
        [INVERSE_FOUNDATION_FUNDER, 'beneficiary'],
    ];

    const tokenCalls = uniqueTokens.flatMap(token => [
        [INVERSE_FOUNDATION_FUNDER, 'tokenBuckets', token],
        [INVERSE_FOUNDATION_FUNDER, 'getTokenAvailable', token],
    ]);

    const delegateCalls = activeDelegateKeys.flatMap(({ delegate, token }) => [
        [INVERSE_FOUNDATION_FUNDER, 'getDelegateAvailable', delegate, token],
    ]);

    const allCalls = [...staticCalls, ...tokenCalls, ...delegateCalls];
    const { data: contractData } = useEtherSWR(allCalls);

    // Step 5: Fetch token metadata for unknown tokens
    const unknownTokenAddrs = useMemo(() => {
        return uniqueTokens.filter(t => !TOKENS[t]);
    }, [uniqueTokens]);

    const tokenMetaCalls = unknownTokenAddrs.flatMap(t => [
        [t, 'symbol'],
        [t, 'decimals'],
    ]);

    const { data: tokenMetaData } = useEtherSWR(
        tokenMetaCalls.length > 0 ? { args: tokenMetaCalls, abi: ERC20_ABI } : []
    );

    // Step 6: Parse contract data
    const gov = contractData?.[0] as string | undefined;
    const beneficiary = contractData?.[1] as string | undefined;

    // Step 7: Fetch gov's balances and allowances for each token
    const govBalanceCalls = gov && uniqueTokens.length > 0
        ? uniqueTokens.flatMap(token => [
            [token, 'balanceOf', gov],
            [token, 'allowance', gov, INVERSE_FOUNDATION_FUNDER],
        ])
        : [];

    const { data: govBalanceData } = useEtherSWR(
        govBalanceCalls.length > 0 ? { args: govBalanceCalls, abi: ERC20_ABI } : []
    );

    // Step 8: Process pull history events with timestamps
    const pullBlockNumbers = useMemo(() => {
        return pullEvents?.map((e: Event) => e.blockNumber) || [];
    }, [pullEvents]);

    const { timestamps } = useBlocksTimestamps(pullBlockNumbers);

    // Step 9: Build token info
    const tokens = useMemo(() => {
        if (!contractData || uniqueTokens.length === 0) return [];
        const nowMs = Date.now();
        const quarterStartMs = nowMs - QUARTER_DURATION * 1000;

        return uniqueTokens.map((tokenAddr, i) => {
            const bucketData = contractData[2 + i * 2]; // tokenBuckets result
            const available = contractData[2 + i * 2 + 1]; // getTokenAvailable result

            const knownToken = TOKENS[tokenAddr];
            let symbol = knownToken?.symbol || '???';
            let decimals = knownToken?.decimals || 18;
            let image = knownToken?.image || '';

            if (!knownToken && tokenMetaData) {
                const unknownIdx = unknownTokenAddrs.indexOf(tokenAddr);
                if (unknownIdx >= 0) {
                    symbol = tokenMetaData[unknownIdx * 2] || symbol;
                    decimals = tokenMetaData[unknownIdx * 2 + 1] || decimals;
                }
            }

            const govBalance = govBalanceData ? getBnToNumber(govBalanceData[i * 2], decimals) : 0;
            const govAllowance = govBalanceData ? getBnToNumber(govBalanceData[i * 2 + 1], decimals) : 0;

            // Compute pulled amounts from events
            const tokenPulls = pullEvents?.filter(
                (e: Event) => e.args!.token.toLowerCase() === tokenAddr.toLowerCase()
            ) || [];
            const totalPulled = tokenPulls.reduce(
                (sum: number, e: Event) => sum + getBnToNumber(e.args!.amount, decimals), 0
            );
            const quarterPulled = tokenPulls.reduce((sum: number, e: Event, idx: number) => {
                const ts = timestamps[pullEvents!.indexOf(e)] || 0;
                return ts >= quarterStartMs ? sum + getBnToNumber(e.args!.amount, decimals) : sum;
            }, 0);

            return {
                address: tokenAddr,
                symbol,
                decimals,
                image,
                quarterlyLimit: bucketData ? getBnToNumber(bucketData.limit, decimals) : 0,
                available: available ? getBnToNumber(available, decimals) : 0,
                interval: bucketData ? Number(bucketData.interval) : QUARTER_DURATION,
                intervalFormatted: formatInterval(bucketData ? Number(bucketData.interval) : QUARTER_DURATION),
                lastUpdated: bucketData ? Number(bucketData.lastUpdated) : 0,
                govBalance,
                govAllowance,
                totalPulled,
                quarterPulled,
            };
        });
    }, [contractData, uniqueTokens, tokenMetaData, govBalanceData, unknownTokenAddrs, pullEvents, timestamps]);

    // Step 10: Build delegates info
    const delegates = useMemo(() => {
        if (!contractData || activeDelegateKeys.length === 0) return [];
        const delegateStartIdx = 2 + uniqueTokens.length * 2;
        return activeDelegateKeys.map(({ delegate, token }, i) => {
            const available = contractData[delegateStartIdx + i];
            const knownToken = TOKENS[token];
            const decimals = knownToken?.decimals || 18;
            const symbol = knownToken?.symbol || '???';
            const image = knownToken?.image || '';

            // Get the latest DelegateSet event for this pair to get limit and interval
            const relevantEvents = delegateEvents
                .filter((e: Event) =>
                    e.args!.delegate.toLowerCase() === delegate.toLowerCase() &&
                    e.args!.token.toLowerCase() === token.toLowerCase()
                )
                .sort((a: Event, b: Event) => b.blockNumber - a.blockNumber);
            const latestEvent = relevantEvents[0];

            return {
                delegate,
                token,
                tokenSymbol: symbol,
                tokenDecimals: decimals,
                tokenImage: image,
                limit: latestEvent ? getBnToNumber(latestEvent.args!.limitAmount, decimals) : 0,
                interval: latestEvent ? Number(latestEvent.args!.interval) : 0,
                intervalFormatted: latestEvent ? formatInterval(Number(latestEvent.args!.interval)) : '-',
                available: available ? getBnToNumber(available, decimals) : 0,
            };
        });
    }, [contractData, activeDelegateKeys, uniqueTokens, delegateEvents]);

    

    const pullHistory = useMemo(() => {
        if (!pullEvents?.length) return [];
        return pullEvents.map((e: Event, i: number) => {
            const tokenAddr = e.args!.token as string;
            const knownToken = TOKENS[tokenAddr];
            const decimals = knownToken?.decimals || 18;
            const symbol = knownToken?.symbol || '???';
            const image = knownToken?.image || '';

            return {
                caller: e.args!.caller as string,
                token: tokenAddr,
                tokenSymbol: symbol,
                tokenImage: image,
                to: e.args!.to as string,
                amount: getBnToNumber(e.args!.amount, decimals),
                reason: e.args!.reason as string,
                txHash: e.transactionHash,
                blockNumber: e.blockNumber,
                timestamp: timestamps[i] || 0,
            };
        }).sort((a, b) => b.blockNumber - a.blockNumber);
    }, [pullEvents, timestamps]);

    // Step 11: Compute auth
    const isBeneficiary = !!account && !!beneficiary && account.toLowerCase() === beneficiary.toLowerCase();
    const isDelegate = !!account && activeDelegateKeys.some(
        d => d.delegate.toLowerCase() === account!.toLowerCase()
    );

    // For delegates: which tokens can they pull for
    const userDelegateTokens = useMemo(() => {
        if (!isDelegate || !account) return [];
        return activeDelegateKeys
            .filter(d => d.delegate.toLowerCase() === account!.toLowerCase())
            .map(d => d.token);
    }, [isDelegate, account, activeDelegateKeys]);

    return {
        gov,
        beneficiary,
        tokens,
        delegates,
        pullHistory,
        isLoading: isLoadingEvents || (!contractData && uniqueTokens.length > 0),
        isBeneficiary,
        isDelegate,
        isAuthed: isBeneficiary || isDelegate,
        userDelegateTokens,
        account,
    };
};
