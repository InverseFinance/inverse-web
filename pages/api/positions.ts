import "source-map-support";
import { getNetworkConfig } from '@app/util/networks';
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis';
import { getPositionsDetails } from '@app/util/positions';

const client = getRedisClient();

export default async function handler(req, res) {
    const { accounts = '' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
    const cacheKey = `${networkConfig.chainId}-positions-v1.1.0`;

    try {
        const validCache = await getCacheFromRedis(cacheKey, true, 60);
        if(validCache && !accounts) {
          res.status(200).json(validCache);
          return
        }

        let meta, positions;

        if (accounts?.length) {
            const result = await getPositionsDetails({
                isFirstBatch: true,
                marketsData: undefined,
                accounts,
                pageOffset: 0,
                pageSize: 100,
            })
            meta = result.meta;
            positions = result.positionDetails;
        } else {
            meta = JSON.parse(await client.get('positions-meta') || '{}');
            const positionsCache = JSON.parse(await client.get('positions') || '{"positions": []}');
            positions = positionsCache.positions;
        }

        const resultData = {
            ...meta,
            nbPositions: positions.length,
            positions: positions,
        };

        if(!accounts) {
            await redisSetWithTimestamp(cacheKey, resultData);
        }

        res.status(200).json(resultData);
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
            res.status(500).json({ error: true });
        }
    }
};
