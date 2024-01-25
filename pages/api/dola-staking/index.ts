import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { CHAIN_ID, ONE_DAY_MS } from '@app/config/constants';
import { SDOLA_ADDRESS, formatDolaStakingData, getDolaSavingsContract, getSdolaContract } from '@app/util/dola-staking';
import { getMulticallOutput } from '@app/util/multicall';
import { getDbrPriceOnCurve } from '@app/util/f2';

export const dolaStakingCacheKey = `dola-staking-v1.0.0`;

export default async function handler(req, res) {    
    const cacheDuration = 600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(dolaStakingCacheKey, true, cacheDuration);
        if(validCache) {
          res.status(200).json(validCache);
          return
        }

        const provider = getProvider(CHAIN_ID);        
        const savingsContract = getDolaSavingsContract(provider);
        const sDolaContract = getSdolaContract(provider);

        const d = new Date();
        const weekFloat = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / (ONE_DAY_MS * 7);
        const weekIndexUtc = Math.floor(weekFloat);

        const dolaStakingData = await getMulticallOutput([
            { contract: savingsContract, functionName: 'claimable', params: [SDOLA_ADDRESS] },
            { contract: savingsContract, functionName: 'balanceOf', params: [SDOLA_ADDRESS] },
            { contract: savingsContract, functionName: 'totalSupply' },
            { contract: savingsContract, functionName: 'yearlyRewardBudget' },
            { contract: savingsContract, functionName: 'maxYearlyRewardBudget' },
            { contract: savingsContract, functionName: 'maxRewardPerDolaMantissa' },
            { contract: sDolaContract, functionName: 'totalSupply' },
            { contract: sDolaContract, functionName: 'weeklyRevenue', params: [weekIndexUtc] },
            { contract: sDolaContract, functionName: 'weeklyRevenue', params: [weekIndexUtc - 1] },            
        ]);

        const { priceInDola: dbrDolaPrice } = await getDbrPriceOnCurve(provider);

        const resultData = {
            timestamp: Date.now(),
            ...formatDolaStakingData(dbrDolaPrice, dolaStakingData),
        }

        await redisSetWithTimestamp(dolaStakingCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(dolaStakingCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
        }
    }
}