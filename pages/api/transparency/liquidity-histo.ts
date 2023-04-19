import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getPoolsAggregatedStats } from '@app/util/pools';
import { liquidityCacheKey } from './liquidity';

export default async function handler(req, res) {
    const { cacheFirst } = req.query;    
    const cacheKey = 'liquidity-history-aggregated'

    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', 300);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }
        const [snapshots, latestLiquidityCache] = await Promise.all([
            getCacheFromRedis('liquidity-history', false, 0, true),
            getCacheFromRedis(liquidityCacheKey, false),
        ]);

        const totalEntries = (snapshots?.entries || []).concat(latestLiquidityCache || []);

        const categories = [
            { name: 'DOLA', args: [undefined, 'DOLA'] },
            { name: 'DOLA-stable', args: [true, 'DOLA'] },
            { name: 'DOLA-volatile', args: [false, 'DOLA'] },
            { name: 'INV', args: [undefined, 'INV'] },
            { name: 'INV-DOLA', args: [undefined, ['INV', 'DOLA']] },
            { name: 'INV-NON_DOLA', args: [undefined, 'INV', 'DOLA'] },
            { name: 'DBR', args: [undefined, 'DBR'] },
            { name: 'DBR-DOLA', args: [undefined, ['DBR', 'DOLA']] },
            { name: 'DBR-NON_DOLA', args: [undefined, 'DBR', 'DOLA'] },
        ]

        const aggregatedHistory = categories.map(cat => {
            return {
                name: cat.name,
                items: totalEntries.map((entry) => {
                    return {
                        timestamp: entry.timestamp,
                        ...getPoolsAggregatedStats(entry.liquidity, ...cat.args),
                    };
                }),
            }
        });

        const resultData = {
            aggregatedHistory,
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
            }
        } catch (e) {
            console.error(e);
        }
    }
}