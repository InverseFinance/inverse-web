import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getPoolsAggregatedStats } from '@app/util/pools';

export default async function handler(req, res) {
    const { cacheFirst, excludeCurrent } = req.query;
    const isExlcudeCurrent = excludeCurrent === 'true';
    const cacheKey = `liquidity-history-aggregated-${isExlcudeCurrent ? '-exclude-current' : ''}v1.0.0`

    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', 60);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }
        
        const [snapshots, latestLiquidityCache] = await Promise.all([
            getCacheFromRedis('liquidity-history', false, 0, true),
            excludeCurrent === 'true' ? new Promise((res) => res(undefined)) : fetch(`https://www.inverse.finance/api/transparency/liquidity?cacheFirst=${cacheFirst}`),
        ]);

        const totalEntries = (snapshots?.entries || []).concat(latestLiquidityCache || { liquidity: [] });

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
        ];

        const aggregatedHistory = categories.reduce((prev, curr) => {
            return {
                ...prev,
                [curr.name]: totalEntries.map((entry) => {
                    return {
                        timestamp: entry.timestamp,
                        ...getPoolsAggregatedStats(entry.liquidity, ...curr.args),
                    };
                }),
            }
        }, {});

        const resultData = {
            timestamp: +(new Date()),
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