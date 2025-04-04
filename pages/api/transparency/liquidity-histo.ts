import 'source-map-support'
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getAggregatedDataFromPools } from '@app/util/pools';

export default async function handler(req, res) {
    const cacheDuration = 120;
    const { cacheFirst, excludeCurrent, chainId } = req.query;
    const isExlcudeCurrent = excludeCurrent === 'true';
    if (isInvalidGenericParam(excludeCurrent) || (!!chainId && !/^[0-9]+$/.test(chainId))) {
        res.status(400).json({ msg: 'invalid request' });
        return;
    }
    const cacheKey = `liquidity-history-aggregated${chainId ? '-c'+chainId+'-' : ''}-${isExlcudeCurrent ? '-exclude-current' : ''}v1.0.2`

    try {
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration, true);
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

        const aggregatedHistory = getAggregatedDataFromPools(totalEntries, undefined, chainId);

        const resultData = {
            timestamp: +(new Date()),
            aggregatedHistory,
        }
        await redisSetWithTimestamp(cacheKey, resultData, true);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false, cacheDuration, true);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
        }
    }
}