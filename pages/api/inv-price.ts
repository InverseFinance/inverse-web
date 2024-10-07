import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types'
import { getProvider } from '@app/util/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import { F2_MARKET_ABI, F2_ORACLE_ABI } from '@app/config/abis'
import { Contract } from 'ethers'
import { getBnToNumber } from '@app/util/markets'

const cacheKey = `inv-price-v1.0.0`;
const { F2_ORACLE, INV, F2_MARKETS } = getNetworkConfigConstants(NetworkIds.mainnet);

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const oracleContract = new Contract(F2_ORACLE, F2_ORACLE_ABI, getProvider(NetworkIds.mainnet));
        const invMarket = F2_MARKETS.find(market => market.isInv);
        const invMarketContract = new Contract(invMarket.address, F2_MARKET_ABI, getProvider(NetworkIds.mainnet));
        const collateralFactorBps = await invMarketContract.collateralFactorBps();
        const invPrice = await oracleContract.viewPrice(INV, collateralFactorBps);

        const prices = {
            'inverse-finance': getBnToNumber(invPrice),
        }

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