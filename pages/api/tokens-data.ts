import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getTokenData } from '@app/util/livecoinwatch';

export const cacheKey = `tokens-data-v1.0.1`;

export default async function handler(req, res) {
    const { cacheFirst } = req.query;

    try {
        const cacheDuration = 1800;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const [dola, inv, dbr, sdola] = await Promise.all([
            fetch(`https://api.coingecko.com/api/v3/coins/dola-usd?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
            fetch(`https://api.coingecko.com/api/v3/coins/inverse-finance?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
            fetch(`https://api.coingecko.com/api/v3/coins/dola-borrowing-right?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
            fetch(`https://api.coingecko.com/api/v3/coins/sdola?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`),
        ]);

        const resultData = {
            timestamp: (+(new Date())-1000),
            dola: { volume: (await dola?.json())?.market_data?.total_volume?.usd },
            inv: { volume: (await inv?.json())?.market_data?.total_volume?.usd },
            dbr: { volume: (await dbr?.json())?.market_data?.total_volume?.usd },
            sdola: { volume: (await sdola?.json())?.market_data?.total_volume?.usd },
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