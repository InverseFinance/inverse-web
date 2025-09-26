import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DOLA3POOLCRV_ABI, SVAULT_ABI } from '@app/config/abis'
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

export const stableReservesCacheKey = `stable-reserves-history-v1.0.91`;

const convexCurveLendingDepositMapping = {
    "oneway-30": "0x6095EC5De7acA5e8938F4ED92E1F868Cab243f5E",
    "oneway-17": "0x7fC1B3BC96EF0D1C63F48504743e6c013BDE0324",
}

const getLlamalendMarkets = async () => {
    const llamaRes = await fetch('https://api.curve.finance/api/getLendingVaults/ethereum/oneway');
    const llamaData = await llamaRes.json();
    return llamaData.data.lendingVaultData
        .filter(m => m.assets.borrowed.symbol === 'crvUSD' && m.assets.borrowed.blockchainId === 'ethereum' && ['sUSDe', 'USDe', 'sFRAX', 'sDOLA', 'sfrxUSD', 'sUSDS', 'sUSDf', 'fxSAVE', 'sdeUSD', 'sreUSD', 'yvUSDC-1', 'yvUSDS-1'].includes(m.assets.collateral.symbol))
        .map(m => {
            return {
                id: m.id,
                // vault where crvUSD is supplied
                vault: m.address,
                // will get collateral price
                amm: m.ammAddress,
                // will get collateral amount & debt amount
                controller: m.controllerAddress,
                collateral: m.assets.collateral.address,
                collateralDecimals: m.assets.collateral.decimals,
            }
        });
}

const getChainStableBalances = async (archivedTimeData, chainId, snapshotsStart, snapshotsEnd, ad1, ad2?: string) => {
    const blockValues = Object.entries(archivedTimeData[chainId]).map(([date, block]) => {
        return { date, block: parseInt(block), timestamp: utcDateStringToTimestamp(date) };
    }).filter(d => d.date >= snapshotsStart && d.date <= snapshotsEnd);

    const blocks = blockValues.map(d => d.block);

    const stables = Object.values(CHAIN_TOKENS[chainId]).filter(t => t.isStable);
    let llamaStables = [];
    console.log(chainId, 'len', stables.length)
    if (chainId === NetworkIds.mainnet) {
        llamaStables = await getLlamalendMarkets();
    }

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
                // handle ERC4626 stable vaults by converting to assets & curve LPs
                stables.map(token => {
                    const contract = new Contract(token.address, token.isLP ? DOLA3POOLCRV_ABI : SVAULT_ABI, getProvider(chainId));
                    return {
                        contract,
                        functionName: token.isLP ? 'get_virtual_price' : 'convertToAssets',
                        params: token.isLP ? undefined : [parseEther('1')],
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
                llamaStables.map(ls => {
                    const contract = new Contract(ls.controller, ["function user_state(address) public view returns (uint,uint,uint,uint)"], getProvider(chainId));
                    return {
                        contract,
                        functionName: 'user_state',
                        params: [ad1 || BURN_ADDRESS],
                        forceFallback: !ad1 || ad1 === BURN_ADDRESS,
                        fallbackValue: [BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0')],
                    }
                }),
                llamaStables.map(ls => {
                    const contract = new Contract(ls.controller, ["function user_state(address) public view returns (uint,uint,uint,uint)"], getProvider(chainId));
                    return {
                        contract,
                        functionName: 'user_state',
                        params: [ad2 || BURN_ADDRESS],
                        forceFallback: !ad2 || ad2 === BURN_ADDRESS,
                        fallbackValue: [BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0')],
                    }
                }),
                // collateral price
                llamaStables.map(ls => {
                    const contract = new Contract(ls.amm, ["function price_oracle() public view returns (uint)"], getProvider(chainId));
                    return {
                        contract,
                        functionName: 'price_oracle',
                        fallbackValue: parseEther('1'),
                    }
                }),
                // crvUsd supplied for lending
                llamaStables.map(ls => {
                    const contract = new Contract(ls.vault, ["function balanceOf(address) public view returns (uint)"], getProvider(chainId));
                    return {
                        contract,
                        functionName: 'balanceOf',
                        params: [ad1 || BURN_ADDRESS],
                        forceFallback: !ad1 || ad1 === BURN_ADDRESS,
                        fallbackValue: BigNumber.from('0'),
                    }
                }),
                llamaStables.map(ls => {
                    const contract = new Contract(ls.vault, ["function balanceOf(address) public view returns (uint)"], getProvider(chainId));
                    return {
                        contract,
                        functionName: 'balanceOf',
                        params: [ad2 || BURN_ADDRESS],
                        forceFallback: !ad2 || ad2 === BURN_ADDRESS,
                        fallbackValue: BigNumber.from('0'),
                    }
                }),
                // share price in lending vault
                llamaStables.map(ls => {
                    const contract = new Contract(ls.vault, ["function pricePerShare() public view returns (uint)"], getProvider(chainId));
                    return {
                        contract,
                        functionName: 'pricePerShare',
                        fallbackValue: BigNumber.from('0'),
                    }
                }),
                // llama, check if lending receipt token is deposited in Convex
                llamaStables.map(ls => {
                    const contract = new Contract(convexCurveLendingDepositMapping[ls.id] || BURN_ADDRESS, ["function balanceOf(address) public view returns (uint)"], getProvider(chainId));
                    return {
                        contract,
                        functionName: 'balanceOf',
                        params: [ad1 || BURN_ADDRESS],
                        forceFallback: !ad1 || ad1 === BURN_ADDRESS || contract.address === BURN_ADDRESS,
                        fallbackValue: BigNumber.from('0'),
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
    console.log('ok ', chainId)
    const stableBalances = results.map((d, i) => {
        const exRatesToStableAssetsRaw = d[2].map((bal, i) => bal);
        const underlyingStableAssetAddresses = d[3].map((asset, i) => asset);
        const underlyings = underlyingStableAssetAddresses.map(ad => getToken(CHAIN_TOKENS[1], ad));
        const exRatesToStableAssets = exRatesToStableAssetsRaw.map((balRaw, i) => getBnToNumber(balRaw, underlyings[i]?.decimals || 18));

        const treasuryBalances = d[0].map((bal, i) => getBnToNumber(bal, stables[i].decimals) * exRatesToStableAssets[i]);
        const twgBalances = d[1].map((bal, i) => getBnToNumber(bal, stables[i].decimals) * exRatesToStableAssets[i]);
        const combinedBalances = treasuryBalances.map((bal, i) => bal + twgBalances[i]);

        // llama stables, equity if borrow position
        const llamaCollateralPrices = d[6].map((bal, i) => getBnToNumber(bal, 18));
        const llamaTreasuryBalances = d[4].map((bal, i) => getBnToNumber(bal[0], llamaStables[i].collateralDecimals) * llamaCollateralPrices[i] - getBnToNumber(bal[2]));
        const llamaTwgBalances = d[5].map((bal, i) => getBnToNumber(bal[0], llamaStables[i].collateralDecimals) * llamaCollateralPrices[i] - getBnToNumber(bal[2]));
        const llamaCombinedBalances = llamaTreasuryBalances.map((bal, i) => bal + llamaTwgBalances[i]);

        // llama stables, supplied for lending
        const llamaVaultSharePrices = d[9].map((bal, i) => getBnToNumber(bal));
        const llamaTreasurySupplied = d[7].map((bal, i) => getBnToNumber(bal) * llamaVaultSharePrices[i]);
        const llamaTwgSupplied = d[8].map((bal, i) => getBnToNumber(bal) * llamaVaultSharePrices[i]);
        const llamaCombinedLendingSupplied = llamaTreasurySupplied.map((bal, i) => bal + llamaTwgSupplied[i]);

        // llama stables, check if lending receipt token is deposited in Convex
        const llamaLendingConvexTokenBalances = d[10].map((bal, i) => getBnToNumber(bal) * llamaVaultSharePrices[i]);

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
        llamaCombinedBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalances[`llama-B-${llamaStables[i].id}`] = bal;
            }
        });
        llamaCombinedLendingSupplied.forEach((bal, i) => {
            if (bal > 0) {
                namedBalances[`llama-L-${llamaStables[i].id}`] = bal;
            }
        });
        llamaLendingConvexTokenBalances.forEach((bal, i) => {
            if (bal > 0) {
                namedBalances[`llama-L-${llamaStables[i].id}-convex`] = bal;
            }
        });

        const sum = combinedBalances.reduce((prev, curr) => prev + curr, 0);
        const llamaEquitySum = llamaCombinedBalances.reduce((prev, curr) => prev + curr, 0);
        const llamaLendingSum = llamaCombinedLendingSupplied.reduce((prev, curr) => prev + curr, 0);
        const llamaLendingConvexSum = llamaLendingConvexTokenBalances.reduce((prev, curr) => prev + curr, 0);
        const llamaSum = llamaLendingSum + llamaEquitySum + llamaLendingConvexSum;

        return {
            utcDate: timestampToUTC(blockValues[i].timestamp),
            timestamp: blockValues[i].timestamp,
            simpleSum: sum,
            sum: sum + llamaSum,
            llamaSum,
            llamaEquitySum,
            llamaLendingSum,
            llamaLendingConvexSum,
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
        const archivedData = cachedData || { totalEvolution: [], snapshotsEnd: '2024-11-01' };

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
            .filter(d => d.utcDate > archivedData?.snapshotsEnd)
        // .slice(-360);

        console.log(archivedData?.snapshotsEnd);
        console.log(lpHistory.length);
        const snapshotsStart = lpHistory[0].utcDate;
        const snapshotsEnd = lpHistory[lpHistory.length - 1].utcDate;

        console.log(snapshotsStart, snapshotsEnd);

        const { data: archivedTimeData } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS };

        const arbMultisigs = MULTISIGS.filter(m => m.chainId === NetworkIds.arbitrum).map(m => m.address);

        const chainIds = [
            NetworkIds.mainnet,
            NetworkIds.base, NetworkIds.optimism, NetworkIds.polygon, NetworkIds.arbitrum
        ];

        console.log('here')
        const chainStableBalancesResults = await Promise.all([
            getChainStableBalances(archivedTimeData, NetworkIds.mainnet, snapshotsStart, snapshotsEnd, TREASURY, twgs[NetworkIds.mainnet]),
            getChainStableBalances(archivedTimeData, NetworkIds.base, snapshotsStart, snapshotsEnd, twgs[NetworkIds.base]),
            getChainStableBalances(archivedTimeData, NetworkIds.optimism, snapshotsStart, snapshotsEnd, twgs[NetworkIds.optimism]),
            getChainStableBalances(archivedTimeData, NetworkIds.polygon, snapshotsStart, snapshotsEnd, twgs[NetworkIds.polygon]),
            getChainStableBalances(archivedTimeData, NetworkIds.arbitrum, snapshotsStart, snapshotsEnd, arbMultisigs[0], arbMultisigs[1]),
        ]);
        console.log('there')

        const flatChainStableBalancesResults = chainStableBalancesResults.flat();

        const past = archivedData?.totalEvolution || [];

        const newEntries = lpHistory.map((d, i) => {
            const dayChainStableBalances = flatChainStableBalancesResults.filter(sb => sb.utcDate === d.utcDate);
            const nonLpReserves = dayChainStableBalances.reduce((prev, curr) => prev + curr.sum, 0);
            const llamaSum = dayChainStableBalances.reduce((prev, curr) => prev + curr.llamaSum, 0);
            const sumByChainId = chainStableBalancesResults.reduce((prev, curr, chainIdIndex) => ({ ...prev, [chainIds[chainIdIndex]]: curr.filter(ss => ss.utcDate === d.utcDate).reduce((sp, sc) => sp + sc.sum, 0) }), {});
            const detailsByChainId = chainStableBalancesResults.reduce((prev, curr, chainIdIndex) => ({ ...prev, [chainIds[chainIdIndex]]: curr.filter(ss => ss.utcDate === d.utcDate).reduce((sp, sc) => ({ ...sp, [chainIds[chainIdIndex]]: sc.namedBalances }), {}) }), {});
            return {
                timestamp: d.timestamp,
                utcDate: d.utcDate,
                llamaSum,
                totalReserves: nonLpReserves,
                // lpReserves: d.ownedStableLpsTvl,
                // nonLpReserves,
                sumByChainId,
                detailsByChainId,
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