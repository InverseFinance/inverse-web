import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID, ONE_DAY_MS, WEEKS_PER_YEAR } from '@app/config/constants';
import { SDOLA_ADDRESS, getDolaSavingsContract } from '@app/util/dola-staking';
import { getMulticallOutput } from '@app/util/multicall';
import { getDbrPriceOnCurve } from '@app/util/f2';

export default async function handler(req, res) {
    const cacheKey = `sdola-cache-v1.0.0`;
    const cacheDuration = 600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
        if(validCache) {
          res.status(200).json(validCache);
          return
        }

        const provider = getProvider(CHAIN_ID);        
        const savingsContract = getDolaSavingsContract(provider);

        const d = new Date();
        const weekFloat = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / (ONE_DAY_MS * 7);
        const weekIndexUtc = Math.floor(weekFloat);

        const dolaSavingsData = await getMulticallOutput([
            { contract: savingsContract, functionName: 'totalSupply' },
            { contract: savingsContract, functionName: 'yearlyRewardBudget' },
            { contract: savingsContract, functionName: 'maxYearlyRewardBudget' },
            { contract: savingsContract, functionName: 'maxRewardPerDolaMantissa' },
            { contract: savingsContract, functionName: 'weeklyRevenue', params: [weekIndexUtc] },
            { contract: savingsContract, functionName: 'weeklyRevenue', params: [weekIndexUtc - 1] },
            { contract: savingsContract, functionName: 'claimable', params: [SDOLA_ADDRESS] },
        ]);
        const { priceInDola: dbrDolaPrice } = await getDbrPriceOnCurve(provider);

        const totalSupply = getBnToNumber(dolaSavingsData[0]);
        const yearlyRewardBudget = getBnToNumber(dolaSavingsData[1]);
        const maxYearlyRewardBudget = getBnToNumber(dolaSavingsData[2]);
        const maxRewardPerDolaMantissa = getBnToNumber(dolaSavingsData[3]);

        // TODO: verify this is correct
        const dbrRatePerDola = Math.min(yearlyRewardBudget / totalSupply, maxRewardPerDolaMantissa);

        // weeklyRevenue = in progress
        const weeklyRevenue = getBnToNumber(dolaSavingsData[4]);
        const pastWeekRevenue = getBnToNumber(dolaSavingsData[5]);

        const apr = totalSupply ? (pastWeekRevenue * WEEKS_PER_YEAR) / totalSupply * 100 : null;
        const projectedApr = dbrDolaPrice ? dbrRatePerDola * dbrDolaPrice * 100 : null;

        const resultData = {
            totalSupply,
            dbrRatePerDola,
            yearlyRewardBudget,
            maxYearlyRewardBudget,
            maxRewardPerDolaMantissa,
            weeklyRevenue,
            pastWeekRevenue,
            sDolaClaimable: getBnToNumber(dolaSavingsData[6]),
            apr,
            projectedApr,
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