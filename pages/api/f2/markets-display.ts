
import { isAddress, verifyMessage } from 'ethers/lib/utils';
import { ADMIN_ADS } from '@app/variables/names';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { getSignMessageWithUtcDate } from '@app/util/misc';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';

export const marketsDisplaysCacheKey = 'markets-displays';

export default async function handler(req, res) {
    const {
        method,
    } = req

    switch (method) {
        case 'PUT':
            try {
                const { sig, marketAddress, noDeposit, isPhasingOut, phasingOutComment } = req.body;
                const whitelisted = ADMIN_ADS;
                const sigAddress = verifyMessage(getSignMessageWithUtcDate(), sig).toLowerCase();

                if (!whitelisted.includes(sigAddress)) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                };

                if (!marketAddress || !isAddress(marketAddress) || !['yes', 'no'].includes(noDeposit) || !['yes', 'no'].includes(isPhasingOut) || isInvalidGenericParam(phasingOutComment)) {
                    res.status(400).json({ status: 'warning', message: 'Invalid values' })
                    return
                }

                const cachedData = (await getCacheFromRedis(marketsDisplaysCacheKey)) || {};

                cachedData[marketAddress] = {
                    noDeposit: noDeposit === 'yes',
                    isPhasingOut: isPhasingOut === 'yes',
                    phasingOutComment,
                };

                const cachedMarketsData = (await getCacheFromRedis(F2_MARKETS_CACHE_KEY)) || {};

                if(cachedMarketsData) {
                    const marketIndex = cachedMarketsData.markets.findIndex(m => m.address === marketAddress);
                    if(marketIndex !== -1) {
                        cachedMarketsData.markets[marketIndex] = {
                            ...cachedMarketsData.markets[marketIndex],
                            ...cachedData[marketAddress],
                        };
                    }
                    // update firm markets cache accordingly
                    await redisSetWithTimestamp(F2_MARKETS_CACHE_KEY, cachedMarketsData);
                }

                await redisSetWithTimestamp(marketsDisplaysCacheKey, cachedData);

                res.status(200).json({ status: 'success' })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['PUT'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}