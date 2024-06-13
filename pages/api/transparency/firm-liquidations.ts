import 'source-map-support'
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getFirmLiquidations } from '@app/util/the-graph'

export default async function handler(req, res) {
    const { borrower } = req.query;
    if (isInvalidGenericParam(borrower)) {
        res.status(400).json({ msg: 'invalid request' });
        return;
    }
    const cacheKey = `firm-${borrower?.toLowerCase() || ''}-liquidations-v1.0.1`;

    try {
        const cacheDuration = 30;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

        if (validCache) {
            res.status(200).send(validCache);
            return
        }

        const result = await getFirmLiquidations({
            borrower: borrower || '',
            size: 1000,
        });

        const liquidations = result.data.liquidates.map(d => {            
            return {
                txHash: d.transaction.id,
                timestamp: parseInt(d.timestamp) * 1000,
                borrower: d.account.id,
                repaidDebt: parseFloat(d.repaidDebt),
                liquidatorReward: parseFloat(d.liquidatorReward),
                liquidator: d.liquidator.id,
                marketAddress: d.market.id,
            }
        });

        const resultData = {
            timestamp: Date.now(),
            liquidations,
        }

        if (!borrower) {
            await redisSetWithTimestamp(cacheKey, resultData);
        }

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).send(cache);
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false });
        }
    }
}