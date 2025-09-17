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

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const { TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
    try {
        const cacheDuration = 180;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(stableReservesCacheKey, cacheFirst !== 'true', cacheDuration);
        if (isValid && cachedData) {
            res.status(200).json(cachedData);
            return
        }

        const TWGmultisig = MULTISIGS.find(m => m.shortName == 'TWG')!;
        const TWG = TWGmultisig.address;

        // lp liquidity snapshots
        const lpRes = await fetch('https://www.inverse.finance/api/transparency/liquidity-snapshots?cacheFirst=true');
        const lpData = await lpRes.json();

        const lpHistory = lpData.entries.map((d, i) => {
            const nonFedLps = d.liquidity.filter(lp => !lp.isFed);
            const ownedStableLpsTvl = nonFedLps.reduce((prev, curr) => prev + (curr.ownedAmount), 0);
            return {
                timestamp: d.timestamp,
                utcDate: timestampToUTC(d.timestamp),
                ownedStableLpsTvl,
            }
        })
        .slice(-10);

        const snapshotsStart = lpHistory[0].utcDate;

        const { data: archivedTimeData } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS };

        const mainnetBlockValues = Object.entries(archivedTimeData["1"]).map(([date, block]) => {
            return { date, block: parseInt(block), timestamp: utcDateStringToTimestamp(date) };
        }).filter(d => d.date >= snapshotsStart);

        const mainnetBlocks = mainnetBlockValues.map(d => d.block);

        const stables = Object.values(CHAIN_TOKENS[1]).filter(t => t.isStable && !t.isLP);

        const results = await throttledPromises(
            (block: number) => {
                return getGroupedMulticallOutputs([
                    stables.map(token => {
                        const contract = new Contract(token.address, SVAULT_ABI, getProvider('1'));
                        return {
                            contract,
                            functionName: 'balanceOf',
                            params: [TREASURY],
                            fallbackValue: BigNumber.from('0'),
                        }
                    }),
                    stables.map(token => {
                        const contract = new Contract(token.address, SVAULT_ABI, getProvider('1'));
                        return {
                            contract,
                            functionName: 'balanceOf',
                            params: [TWG],
                            fallbackValue: BigNumber.from('0'),
                        }
                    }),
                    // handle ERC4626 stable vaults by converting to assets
                    stables.map(token => {
                        const contract = new Contract(token.address, SVAULT_ABI, getProvider('1'));
                        return {
                            contract,
                            functionName: 'convertToAssets',
                            params: [parseEther('1')],
                            fallbackValue: parseEther('1'),
                        }
                    }),
                    stables.map(token => {
                        const contract = new Contract(token.address, SVAULT_ABI, getProvider('1'));
                        return {
                            contract,
                            functionName: 'asset',
                            fallbackValue: BURN_ADDRESS,
                        }
                    }),
                ],
                    1,
                    block,
                );
            },
            mainnetBlocks,
            5,
            100,
        );

        const stableBalances = results.map((d, i) => {
            const treasuryBalances = d[0].map((bal, i) => getBnToNumber(bal, stables[i].decimals));
            const twgBalances = d[1].map((bal, i) => getBnToNumber(bal, stables[i].decimals));
            const exRatesToStableAssetsRaw = d[2].map((bal, i) => bal);
            const underlyingStableAssetAddresses = d[3].map((asset, i) => asset);
            const underlyings = underlyingStableAssetAddresses.map(ad => getToken(CHAIN_TOKENS[1], ad));
            const exRatesToStableAssets = exRatesToStableAssetsRaw.map((balRaw, i) => getBnToNumber(balRaw, underlyings[i]?.decimals || 18));
            const totalStables = treasuryBalances.map((bal, i) => bal * exRatesToStableAssets[i] + twgBalances[i] * exRatesToStableAssets[i]);
            const namedBalances = {};
            totalStables.forEach((bal, i) => {
                if (bal > 0) {
                    namedBalances[stables[i].symbol] = bal;
                }
            });
            const totalAggregatedBalances = totalStables.reduce((prev, curr) => prev + curr, 0);
            return {
                timestamp: mainnetBlockValues[i].timestamp,
                namedBalances,
                utcDate: timestampToUTC(mainnetBlockValues[i].timestamp),
                // stableSymbols: stables.map(s => s.symbol),
                treasuryBalances,
                twgBalances,
                exRatesToStableAssets,
                totalStables,
                totalAggregatedBalances,
            }
        });

        const resultData = {
            timestamp: Date.now(),
            snapshotsStart,
            // stables,
            stableBalances,
            lpHistory,
            totalEvolution: lpHistory.map((d, i) => {
                const nonLpReserves = stableBalances.find(sb => sb.utcDate === d.utcDate)?.totalAggregatedBalances || 0;
                return {
                    timestamp: d.timestamp,
                    utcDate: d.utcDate,
                    totalReserves: d.ownedStableLpsTvl + nonLpReserves,
                    lpReserves: d.ownedStableLpsTvl,
                    nonLpReserves,
                }
            }),
        }
        // await redisSetWithTimestamp(stableReservesCacheKey, resultData);

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