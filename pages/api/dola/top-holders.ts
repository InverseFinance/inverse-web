import 'source-map-support'
import { BigNumber } from 'ethers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getTokenHolders } from '@app/util/covalent';
import { getBnToNumber } from '@app/util/markets';

const { DOLA, F2_MARKETS, NAMED_ADDRESSES } = getNetworkConfigConstants();

const NB_TOP_HOLDERS = 100;
// the names lists are not consistent in their addresses casing
const LABELS = Object.fromEntries(Object.entries(NAMED_ADDRESSES).map(([address, name]) => [address.toLowerCase(), name]));
const FIRM_MARKETS = new Set(F2_MARKETS.map(m => m.address.toLowerCase()));

// top DOLA holders on mainnet, the FiRM markets are grouped as one holder
export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const cacheKey = 'dola-top-holders-v1.0.0';
    const cacheDuration = 1800;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            return res.status(200).json(validCache);
        }

        // sorted by balance, the first 1000 holders include all the FiRM markets with a meaningful balance
        const holdersData = await getTokenHolders(DOLA, 1000, 0, '1');
        const items = holdersData?.data?.items;
        if (!items?.length) {
            throw new Error(holdersData?.error_message || 'No token holders data');
        }
        const decimals = items[0].contract_decimals;
        const totalSupply = getBnToNumber(BigNumber.from(items[0].total_supply), decimals);

        const holders = items.map(item => ({
            address: item.address,
            label: LABELS[item.address.toLowerCase()] || null,
            balance: getBnToNumber(BigNumber.from(item.balance), decimals),
        }));
        const firmMarketsHolders = holders.filter(h => FIRM_MARKETS.has(h.address.toLowerCase()));
        const firmMarketsItem = {
            address: null,
            label: 'FiRM markets (unborrowed DOLA)',
            balance: firmMarketsHolders.reduce((prev, curr) => prev + curr.balance, 0),
        };

        const topHolders = holders
            .filter(h => !FIRM_MARKETS.has(h.address.toLowerCase()))
            .concat(firmMarketsHolders.length > 0 ? [firmMarketsItem] : [])
            .sort((a, b) => b.balance - a.balance)
            .slice(0, NB_TOP_HOLDERS)
            .map(h => ({ ...h, label: h.label?.replace('anDOLA', 'Frontier DOLA')?.replace('DSA', 'DSA (sDOLA)'), supplyPercentage: totalSupply > 0 ? h.balance / totalSupply * 100 : 0 }));

        const resultData = {
            timestamp: Date.now(),
            // block of the balances and supply
            blockHeight: items[0].block_height,
            totalSupply,
            holders: topHolders,
        }

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ success: false });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false });
        }
    }
}
