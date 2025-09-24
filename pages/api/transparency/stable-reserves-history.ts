import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { SVAULT_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { throttledPromises, timestampToUTC, utcDateStringToTimestamp } from '@app/util/misc';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { parseEther } from '@ethersproject/units';
import { BURN_ADDRESS } from '@app/config/constants';

export const stableReservesCacheKey = `stable-reserves-history-v1.0.0`;

const getChainStableBalances = async (archivedTimeData, chainId, snapshotsStart, snapshotsEnd, ad1, ad2?: string) => {
    const blockValues = Object.entries(archivedTimeData[chainId]).map(([date, block]) => {
        return { date, block: parseInt(block), timestamp: utcDateStringToTimestamp(date) };
    }).filter(d => d.date >= snapshotsStart && d.date <= snapshotsEnd);

    const blocks = blockValues.map(d => d.block);

    const stables = Object.values(CHAIN_TOKENS[chainId]).filter(t => t.isStable && !t.isLP);

    const results = await throttledPromises(
        (block: number) => {
            return getGroupedMulticallOutputs([
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'balanceOf',
                        params: [ad1 || BURN_ADDRESS],
                        forceFallback: !ad1 || ad1 === BURN_ADDRESS,
                        fallbackValue: BigNumber.from('0'),
                    }
                }),
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'balanceOf',
                        params: [ad2 || BURN_ADDRESS],
                        forceFallback: !ad2 || ad2 === BURN_ADDRESS,
                        fallbackValue: BigNumber.from('0'),
                    }
                }),
                // handle ERC4626 stable vaults by converting to assets
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'convertToAssets',
                        params: [parseEther('1')],
                        forceFallback: chainId !== NetworkIds.mainnet,
                        fallbackValue: parseEther('1'),
                    }
                }),
                stables.map(token => {
                    const contract = new Contract(token.address, SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: 'asset',
                        forceFallback: chainId !== NetworkIds.mainnet,
                        fallbackValue: BURN_ADDRESS,
                    }
                }),
            ],
                Number(chainId),
                block,
                undefined,
                true,
            );
        },
        blocks,
        5,
        100,
    );

    const stableBalances = results.map((d, i) => {
        const exRatesToStableAssetsRaw = d[2].map((bal, i) => bal);
        const underlyingStableAssetAddresses = d[3].map((asset, i) => asset);
        const underlyings = underlyingStableAssetAddresses.map(ad => getToken(CHAIN_TOKENS[1], ad));
        const exRatesToStableAssets = exRatesToStableAssetsRaw.map((balRaw, i) => getBnToNumber(balRaw, underlyings[i]?.decimals || 18));

        const treasuryBalances = d[0].map((bal, i) => getBnToNumber(bal, stables[i].decimals) * exRatesToStableAssets[i]);
        const twgBalances = d[1].map((bal, i) => getBnToNumber(bal, stables[i].decimals) * exRatesToStableAssets[i]);
        const combinedBalances = treasuryBalances.map((bal, i) => bal + twgBalances[i]);

        const namedBalances = {};
        const namedBalancesT1 = {};
        const namedBalancesT2 = {};

        treasuryBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalancesT1[stables[i].symbol] = bal;
            }
        });
        twgBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalancesT2[stables[i].symbol] = bal;
            }
        });
        combinedBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalances[stables[i].symbol] = bal;
            }
        });

        const sum = combinedBalances.reduce((prev, curr) => prev + curr, 0);
        return {
            utcDate: timestampToUTC(blockValues[i].timestamp),
            timestamp: blockValues[i].timestamp,
            sum,
            namedBalances,
            namedBalancesT1,
            namedBalancesT2,
        }
    });
    return stableBalances;
}

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const { TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
    try {
        const cacheDuration = 999999;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(stableReservesCacheKey, cacheFirst !== 'true', cacheDuration);
        if (isValid && cachedData) {
            res.status(200).json(cachedData);
            return
        }

        const twgs = MULTISIGS
            .filter(m => m.shortName.includes('TWG'))
            .reduce((prev, curr) => ({ ...prev, [curr.chainId]: curr.address }), {});

        // lp liquidity snapshots
        const lpRes = await fetch('https://www.inverse.finance/api/transparency/liquidity-snapshots?cacheFirst=true');
        const lpData = await lpRes.json();

        const lpHistory = lpData.entries.map((d, i) => {
            const nonFedLps = d.liquidity.filter(lp => lp.isStable && !lp.isFed);
            const ownedStableLpsTvl = nonFedLps.reduce((prev, curr) => prev + (curr.owned?.twg || 0) + (curr.owned?.treasuryContract || 0), 0);
            // const byChainId = nonFedLps.reduce((prev, curr) => ({ ...prev, [curr.chainId]: (prev[curr.chainId] || 0) + curr.ownedAmount }), {});
            return {
                timestamp: d.timestamp,
                utcDate: timestampToUTC(d.timestamp),
                ownedStableLpsTvl,
                // byChainId,
            }
        })
            .filter(d => d.utcDate > cachedData?.snapshotsEnd)
            // .slice(-360);

        const snapshotsStart = lpHistory[0].utcDate;
        const snapshotsEnd = lpHistory[lpHistory.length - 1].utcDate;

        const { data: archivedTimeData } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS };

        const arbMultisigs = MULTISIGS.filter(m => m.chainId === NetworkIds.arbitrum).map(m => m.address);

        const chainIds = [
            NetworkIds.mainnet,
            NetworkIds.base, NetworkIds.optimism, NetworkIds.polygon, NetworkIds.arbitrum
        ];

        const chainStableBalancesResults = await Promise.all([
            getChainStableBalances(archivedTimeData, NetworkIds.mainnet, snapshotsStart, snapshotsEnd, TREASURY, twgs[NetworkIds.mainnet]),
            getChainStableBalances(archivedTimeData, NetworkIds.base, snapshotsStart, snapshotsEnd, twgs[NetworkIds.base]),
            getChainStableBalances(archivedTimeData, NetworkIds.optimism, snapshotsStart, snapshotsEnd, twgs[NetworkIds.optimism]),
            getChainStableBalances(archivedTimeData, NetworkIds.polygon, snapshotsStart, snapshotsEnd, twgs[NetworkIds.polygon]),
            getChainStableBalances(archivedTimeData, NetworkIds.arbitrum, snapshotsStart, snapshotsEnd, arbMultisigs[0], arbMultisigs[1]),
        ]);

        const flatChainStableBalancesResults = chainStableBalancesResults.flat();

        const past = cachedData?.totalEvolution || [];

        const newEntries = lpHistory.map((d, i) => {
            const dayChainStableBalances = flatChainStableBalancesResults.filter(sb => sb.utcDate === d.utcDate);
            const nonLpReserves = dayChainStableBalances.reduce((prev, curr) => prev + curr.sum, 0);
            const stablesByChainId = chainStableBalancesResults.reduce((prev, curr, chainIdIndex) => ({ ...prev, [chainIds[chainIdIndex]]: curr }), {});
            return {
                timestamp: d.timestamp,
                utcDate: d.utcDate,
                totalReserves: d.ownedStableLpsTvl + nonLpReserves,
                lpReserves: d.ownedStableLpsTvl,
                nonLpReserves,
                // stablesByChainId,
                // lpsByChainId: d.byChainId,
            }
        });

        const totalEvolution = past.concat(newEntries);

        const resultData = {
            timestamp: Date.now(),
            snapshotsStart: totalEvolution[0].utcDate,
            snapshotsEnd: totalEvolution[totalEvolution.length - 1].utcDate,
            totalEvolution,
        }

        await redisSetWithTimestamp(stableReservesCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(stableReservesCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
            return res.status(500);
        }
    }
}