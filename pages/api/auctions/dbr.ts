import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { getMulticallOutput } from '@app/util/multicall';
import { getDbrAuctionContract } from '@app/util/dbr-auction';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';

export default async function handler(req, res) {
    const cacheKey = `dbr-auction-v1.0.1`;
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
        if(validCache) {
          res.status(200).json(validCache);
          return
        }

        const provider = getProvider(CHAIN_ID);        
        const auctionContract = getDbrAuctionContract(provider);

        const auctionData = await getMulticallOutput([
            { contract: auctionContract, functionName: 'getCurrentReserves' },
            { contract: auctionContract, functionName: 'dbrRatePerYear' },
            { contract: auctionContract, functionName: 'maxDbrRatePerYear' },
        ]);

        const rateUpdates = await auctionContract.queryFilter(auctionContract.filters.RateUpdate(), 0);
        const rateUpdatesTs = await addBlockTimestamps(rateUpdates.map(e => e.blockNumber), NetworkIds.mainnet);        

        const dolaReserve = getBnToNumber(auctionData[0][0]);
        const dbrReserve = getBnToNumber(auctionData[0][1]);
        const yearlyRewardBudget = getBnToNumber(auctionData[1]);
        const maxYearlyRewardBudget = getBnToNumber(auctionData[2]);

        const resultData = {
            timestamp: Date.now(),
            dolaReserve,
            dbrReserve,
            yearlyRewardBudget,
            maxYearlyRewardBudget,
            historicalRates: rateUpdates.map((e, i) => {
                return { timestamp: rateUpdatesTs[NetworkIds.mainnet][e.blockNumber] * 1000, block: e.blockNumber, rate: getBnToNumber(e.args[0]) }
            }),
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