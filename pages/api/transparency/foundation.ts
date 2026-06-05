import { Contract } from 'ethers'
import 'source-map-support'
import { INVERSE_FOUNDATION_FUNDER_ABI, ERC20_ABI } from '@app/config/abis'
import { INVERSE_FOUNDATION_FUNDER } from '@app/config/constants'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types'
import { getBnToNumber } from '@app/util/markets'
import { addBlockTimestamps } from '@app/util/timestamps'

const { TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

const QUARTER_DURATION = 90 * 24 * 3600;

const formatInterval = (seconds: number): string => {
    const days = Math.round(seconds / 86400);
    if (days >= 90) return `${Math.round(days / 30)} months`;
    if (days >= 1) return `${days} day${days !== 1 ? 's' : ''}`;
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
};

const getCalendarQuarterStartMs = () => {
    const now = new Date();
    const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), quarterMonth, 1).getTime();
};

export const getFoundationData = async () => {
    const provider = getProvider(NetworkIds.mainnet);
    const contract = new Contract(INVERSE_FOUNDATION_FUNDER, INVERSE_FOUNDATION_FUNDER_ABI, provider);

    // Step 1: Fetch all events + static state in parallel
    const [quarterlyEvents, delegateEvents, pullEvents, gov, beneficiary] = await Promise.all([
        contract.queryFilter(contract.filters.QuarterlyLimitSet()),
        contract.queryFilter(contract.filters.DelegateSet()),
        contract.queryFilter(contract.filters.FundsPulled()),
        contract.gov(),
        contract.beneficiary(),
    ]);

    // Step 2: Extract unique token addresses from QuarterlyLimitSet events
    const seen = new Set<string>();
    const uniqueTokens: string[] = [];
    for (const e of quarterlyEvents) {
        const addr = e.args!.token.toLowerCase();
        if (!seen.has(addr)) {
            seen.add(addr);
            uniqueTokens.push(e.args!.token as string);
        }
    }

    // Step 3: Extract active delegates from DelegateSet events
    const delegateMap = new Map<string, any>();
    [...delegateEvents]
        .sort((a, b) => a.blockNumber - b.blockNumber)
        .forEach(e => {
            const key = `${e.args!.delegate.toLowerCase()}-${e.args!.token.toLowerCase()}`;
            delegateMap.set(key, e);
        });
    const activeDelegateKeys = [...delegateMap.values()]
        .filter(e => !e.args!.limitAmount.isZero())
        .map(e => ({
            delegate: e.args!.delegate as string,
            token: e.args!.token as string,
        }));

    // Step 4: Fetch on-chain state per-token and per-delegate
    const [tokenResults, delegateResults] = await Promise.all([
        Promise.all(uniqueTokens.flatMap(token => [
            contract.tokenBuckets(token),
            contract.getTokenAvailable(token),
        ])),
        Promise.all(activeDelegateKeys.map(({ delegate, token }) =>
            contract.getDelegateAvailable(delegate, token),
        )),
    ]);

    // Step 5: Fetch token metadata for unknown tokens
    const unknownTokenAddrs = uniqueTokens.filter(t => !TOKENS[t]);
    let tokenMetaResults: any[] = [];
    if (unknownTokenAddrs.length > 0) {
        tokenMetaResults = await Promise.all(
            unknownTokenAddrs.flatMap(t => {
                const c = new Contract(t, ERC20_ABI, provider);
                return [c.symbol(), c.decimals()];
            })
        );
    }

    // Step 6: Fetch gov's balances and allowances per token
    let govBalanceResults: any[] = [];
    if (gov && uniqueTokens.length > 0) {
        govBalanceResults = await Promise.all(
            uniqueTokens.flatMap(token => {
                const c = new Contract(token, ERC20_ABI, provider);
                return [c.balanceOf(gov), c.allowance(gov, INVERSE_FOUNDATION_FUNDER)];
            })
        );
    }

    // Step 7: Fetch block timestamps for pull events
    const pullBlockNumbers = pullEvents.map(e => e.blockNumber);
    const blockTimestamps = pullBlockNumbers.length > 0
        ? await addBlockTimestamps(pullBlockNumbers, NetworkIds.mainnet)
        : {};
    const chainTimestamps = blockTimestamps[NetworkIds.mainnet] || {};

    // Step 8: Build token info
    const calendarQuarterStartMs = getCalendarQuarterStartMs();

    const tokens = uniqueTokens.map((tokenAddr, i) => {
        const bucketData = tokenResults[i * 2];
        const available = tokenResults[i * 2 + 1];

        const knownToken = TOKENS[tokenAddr];
        let symbol = knownToken?.symbol || '???';
        let decimals = knownToken?.decimals || 18;
        let image = knownToken?.image || '';

        if (!knownToken && tokenMetaResults.length > 0) {
            const unknownIdx = unknownTokenAddrs.indexOf(tokenAddr);
            if (unknownIdx >= 0) {
                symbol = tokenMetaResults[unknownIdx * 2] || symbol;
                decimals = tokenMetaResults[unknownIdx * 2 + 1] || decimals;
            }
        }

        const govBalance = govBalanceResults.length > 0 ? getBnToNumber(govBalanceResults[i * 2], decimals) : 0;
        const govAllowance = govBalanceResults.length > 0 ? getBnToNumber(govBalanceResults[i * 2 + 1], decimals) : 0;

        // Compute pulled amounts
        const tokenPulls = pullEvents.filter(
            e => e.args!.token.toLowerCase() === tokenAddr.toLowerCase()
        );
        const totalPulled = tokenPulls.reduce(
            (sum, e) => sum + getBnToNumber(e.args!.amount, decimals), 0
        );
        const quarterPulled = tokenPulls.reduce((sum, e) => {
            const ts = (chainTimestamps[e.blockNumber] || 0) * 1000; // convert secs to ms
            return ts >= calendarQuarterStartMs ? sum + getBnToNumber(e.args!.amount, decimals) : sum;
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

    // Step 9: Build delegates info
    const delegates = activeDelegateKeys.map(({ delegate, token }, i) => {
        const available = delegateResults[i];
        const knownToken = TOKENS[token];
        const decimals = knownToken?.decimals || 18;
        const symbol = knownToken?.symbol || '???';
        const image = knownToken?.image || '';

        const relevantEvents = delegateEvents
            .filter(e =>
                e.args!.delegate.toLowerCase() === delegate.toLowerCase() &&
                e.args!.token.toLowerCase() === token.toLowerCase()
            )
            .sort((a, b) => b.blockNumber - a.blockNumber);
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

    // Step 10: Build pull history
    const pullHistory = pullEvents.map((e, i) => {
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
            timestamp: (chainTimestamps[e.blockNumber] || 0) * 1000,
        };
    }).sort((a, b) => b.blockNumber - a.blockNumber);

    return {
        gov,
        beneficiary,
        tokens,
        delegates,
        pullHistory,
        timestamp: Date.now(),
    };
};

export default async function handler(req, res) {
    const cacheKey = `foundation-v1.0.0`;
    const { cacheFirst } = req.query;

    try {
        const cacheDuration = 60;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);

        if (validCache) {
            res.status(200).json(validCache);
            return;
        }

        const data = await getFoundationData();
        await redisSetWithTimestamp(cacheKey, data);
        res.status(200).json(data);
    } catch (err) {
        console.error('Foundation API error:', err);
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Foundation API: returning last cache on error');
                res.status(200).json(cache);
                return;
            }
        } catch (e) { }
        res.status(500).json({ success: false });
    }
}
