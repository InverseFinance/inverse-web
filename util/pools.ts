import { DOLA_BRIDGED_CHAINS } from "@app/config/constants";
import { parseUnits } from "@ethersproject/units";
import { getBnToNumber } from "./markets";
import { NetworkIds, SWR } from "@app/types";
import { useCustomSWR } from "@app/hooks/useCustomSWR";
import { fetcher } from "./web3";

export const getPoolsAggregatedStats = (
    items: any[],
    chainId = '',
    isStable?: boolean,
    include?: string | string[],
    exclude?: string | string[],
): {
    tvl: number,
    balance: number,
    pairingDepth: number,
    avgDolaWeight: number,
    pol: number,
    rewardDay: number,
    avgApy: number,
    avgDom: number,
    chainId?: string,
} => {
    const _include = (Array.isArray(include) ? include : [include || '']).map(inc => inc.replace(/sdola/ig, '$SD'));
    const _exclude = (Array.isArray(exclude) ? exclude : [exclude || '']).map(exc => exc.replace(/sdola/ig, '$SD'));

    const filteredItems = items?.filter(lp => {
        return (isStable === undefined || (lp.isStable || false) === isStable)
            && _include.every(inc => lp.name.includes(inc))
            && (!!exclude ? _exclude.every(exc => !lp.name.includes(exc)) : true)
            && (!!chainId ? lp.chainId === chainId : true)
    }) || [];

    const toExcludeFromAggregate = filteredItems.filter(lp => !!lp.deduce).flatMap(lp => lp.deduce);
    const itemsWithoutChildren = filteredItems.filter(lp => !toExcludeFromAggregate.includes(lp.address));
    // avoid double count for tvl, pair balances
    const tvl = itemsWithoutChildren.reduce((prev, curr) => prev + curr.tvl, 0);
    const balance = itemsWithoutChildren.reduce((prev, curr) => prev + curr.dolaBalance, 0);
    const pairingDepth = itemsWithoutChildren.reduce((prev, curr) => prev + curr.pairingDepth, 0);
    const avgDolaWeight = itemsWithoutChildren.reduce((prev, curr) => prev + (curr.dolaWeight / 100 * curr.tvl), 0) / tvl * 100;
    // pol, apy, should include derived pools such as Aura
    const pol = itemsWithoutChildren.reduce((prev, curr) => prev + curr.ownedAmount, 0);
    const rewardDay = filteredItems.filter(lp => !lp.deduce).reduce((prev, curr) => prev + curr.rewardDay, 0);
    const avgApy = filteredItems.reduce((prev, curr) => prev + ((curr.apy || 0) / 100 * curr.tvl), 0) / tvl * 100;
    const avgDom = filteredItems.reduce((prev, curr) => prev + ((curr.perc || 0) / 100 * curr.tvl), 0) / tvl * 100;

    return {
        tvl,
        balance,
        pairingDepth,
        avgDolaWeight,
        pol,
        rewardDay,
        avgApy,
        avgDom,
        chainId,
    }
}

export const POOL_CATEGORIES = [
    { name: 'DOLA', args: [undefined, 'DOLA'] },
    { name: 'DOLA-stable', args: [true, 'DOLA'] },
    { name: 'DOLA-volatile', args: [false, 'DOLA'] },
    { name: 'INV', args: [undefined, 'INV'] },
    { name: 'INV-DOLA', args: [undefined, ['INV', 'DOLA']] },
    { name: 'INV-NON_DOLA', args: [undefined, 'INV', 'DOLA'] },
    { name: 'DBR', args: [undefined, 'DBR'] },
    { name: 'DBR-DOLA', args: [undefined, ['DBR', 'DOLA']] },
    { name: 'DBR-NON_DOLA', args: [undefined, 'DBR', 'DOLA'] },
    { name: 'SDOLA', args: [undefined, ['SDOLA', 'sDOLA']] },
    { name: 'SDOLA-DOLA', args: [undefined, ['SDOLA', 'sDOLA', 'DOLA']] },
    { name: 'SDOLA-NON_DOLA', args: [undefined, ['SDOLA', 'sDOLA'], 'DOLA'] },
];

export const getAggregatedDataFromPools = (totalEntries: any, categories = POOL_CATEGORIES, chainId?: NetworkIds) => {
    return categories.reduce((prev, curr) => {    
        const key = curr.name;
        return {
            ...prev,
            [key]: totalEntries.map((entry) => {
                return {
                    timestamp: entry.timestamp,
                    ...getPoolsAggregatedStats(entry.liquidity, chainId, ...curr.args),
                };
            }),
        }
    }, {});
}

export const addCurrentToHistory = (aggregatedHistory, currentEntry: any, categories = POOL_CATEGORIES, chainId?: NetworkIds) => {
    if (!currentEntry) return aggregatedHistory;
    const historyAndCurrent = { ...aggregatedHistory };
    const currentAggregated = getAggregatedDataFromPools([currentEntry], categories, chainId);
    categories.forEach((category) => {
        const key = category.name;
        const histo = aggregatedHistory[key] || [];
        historyAndCurrent[key] = [...histo, (currentAggregated[key] || [])[0]];
    });
    return historyAndCurrent;
}

export const getLpHistory = async (address: string, excludeCurrent = true) => {
    let data;
    try {
        const res = await fetch(`/api/transparency/lp-histo?excludeCurrent=${excludeCurrent}&address=${address}`)
        data = await res.json();
    } catch (e) { }
    return data;
}

export const useMultichainPoolsForDola = (): SWR & { data: { [key: string]: number | undefined | null } } => {
    const { data, error } = useCustomSWR(`multichain-pools`, getMultichainPoolsForDola);

    return {
        data: data || {},
        isLoading: !error && !data,
        isError: error,
    }
}

const multichainNotSupportedYet = [NetworkIds.arbitrum, NetworkIds.polygon];

export const getMultichainPoolsForDola = async () => {
    let data = {};
    try {
        const res = await fetch(`https://bridgeapi.anyswap.exchange/data/router/v2/pools`)
        const multichainData = await res.json();
        DOLA_BRIDGED_CHAINS.concat('1').forEach(chainId => {
            const chainData = multichainData[chainId];
            const chainDola = Object.values(chainData).find(t => t.symbol === 'DOLA');
            if (chainDola) {
                data[chainId] = getBnToNumber(parseUnits(chainDola.liquidity, 0));
            } else {
                data[chainId] = multichainNotSupportedYet.includes(chainId) ? undefined : null;
            }
        });
    } catch (e) { }
    return data;
}

// Recreate / update histo,
export const getPoolFixtures = (oldEntries) => {
    // index: 0 new pool, index: original derived pool to copy from (eg: bal pool related to aura pool)
    const fixture = [
        // cvx
        ['0x0404d05F3992347d2f0dC3a97bdd147D77C85c1c', '0xE57180685E3348589E9521aa53Af0BCD497E884d'],
        // aura ee
        ['0xFdbd847B7593Ef0034C58258aD5a18b34BA6cB29', '0x133d241F225750D2c92948E464A5a80111920331'],
        // aura usdc
        ['0x22915f309ec0182c85cd8331c23bd187fd761360', '0xFf4ce5AAAb5a627bf82f4A571AB1cE94Aa365eA6'],
    ];

    const metas = {};
    fixture.forEach(([key, val]) => {
        const last = oldEntries[oldEntries.length - 1];
        const found = last.liquidity.find((pool) => pool.address === key);
        metas[key] = found;
    });

    const fixedEntries = [...oldEntries];

    oldEntries.forEach((entry, i) => {
        fixture.forEach(([key, val]) => {
            const found = entry.liquidity.find((pool) => pool.address === key);
            if (!found) {
                const og = entry.liquidity.find((pool) => pool.address === val);
                const ogIndex = entry.liquidity.findIndex((pool) => pool.address === val);
                if (!!og) {
                    fixedEntries[i].liquidity.push({
                        ...metas[key],
                        apy: og.apy,
                        apyMean30d: og.apyMean30d,
                        owned: og.owned,
                        ownedAmount: og.ownedAmount,
                        perc: og.perc,
                        pairingDepth: og.pairingDepth,
                        dolaBalance: og.dolaBalance,
                        dolaWeight: og.dolaWeight,
                        rewardDay: og.rewardDay,
                        isFed: true,
                    });
                    fixedEntries[i].liquidity[ogIndex] = { ...og, isFed: false };
                } else {
                    console.log('og not found', val);
                }
            }
        });
    });
}