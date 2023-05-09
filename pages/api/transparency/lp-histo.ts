import 'source-map-support'
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getAggregatedDataFromPools } from '@app/util/pools';

export default async function handler(req, res) {
    const { cacheFirst, excludeCurrent, address } = req.query;
    const isExlcudeCurrent = excludeCurrent === 'true';
    if (isInvalidGenericParam(address) || isInvalidGenericParam(excludeCurrent)) {
        res.status(400).json({ msg: 'invalid request' });
        return;
    }
    const cacheKey = `lp-history-aggregated-${address}-${isExlcudeCurrent ? '-exclude-current' : ''}v1.0.0`

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

        const totalEntries = (snapshots?.entries || [])
            .concat(latestLiquidityCache ? await latestLiquidityCache?.json() : { liquidity: [] })
            .filter((entry) => entry.liquidity.length > 0);

        const lpEntries = totalEntries.map((entry) => {
            return {
                timestamp: entry.timestamp,
                liquidity: entry.liquidity.filter((lp) => lp.address === address),
            }
        });

        const lpHistory = getAggregatedDataFromPools(lpEntries, [{ name: 'LP', args: [undefined, undefined, ''] }]);

        const resultData = {
            timestamp: +(new Date()),
            lpHistory,
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