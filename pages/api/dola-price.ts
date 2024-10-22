import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Prices } from '@app/types'
import { getTokenData } from '@app/util/livecoinwatch'
import { cgPricesCacheKey } from './prices'
import { getDolaUsdPriceOnCurve } from '@app/util/f2'
import { getProvider } from '@app/util/providers'

const cacheKey = `dola-price-v1.0.0`;

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const cacheDuration = 90;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const uniqueCgIds = ['dola-usd'];
        const prices = {};
        let geckoPrices: Prices["prices"] = {};

        try {
            const res = await fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${uniqueCgIds.join(',')}`);
            geckoPrices = await res.json();
        } catch (e) {
            console.log('Error fetching gecko prices');
            geckoPrices = (await getCacheFromRedis(cgPricesCacheKey, false)) || {};
        }
        prices['dola-usd-cg'] = geckoPrices['dola-usd']?.usd;

        try {
            geckoPrices['dola-usd-cg'] = geckoPrices['dola-usd'];
            const dolaData = await getTokenData('DOLA');            
            if (dolaData?.rate) {
                prices['dola-usd-lcw'] = dolaData.rate
            }
        } catch (e) {
            console.log('Error livecoinwatch gecko prices');
        }

        const { price: dolaOnChainPrice, tvl: crvUsdDolaTvl } = await getDolaUsdPriceOnCurve(getProvider(NetworkIds.mainnet));
        
        prices['dola-onchain-usd'] = dolaOnChainPrice;
        prices['dola-usd'] = crvUsdDolaTvl >= 500000 ? dolaOnChainPrice : prices['dola-usd-cg'] || prices['dola-usd-lcw'];

        prices['_timestamp'] = +(new Date());

        await redisSetWithTimestamp(cacheKey, prices);

        res.status(200).json(prices)
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
            res.status(500).json({ success: false });
        }
    }
}