import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { CHAIN_ID, ONE_DAY_MS, SDOLA_ADDRESS } from '@app/config/constants';
import { formatDolaStakingData, getDolaSavingsContract, getSdolaContract } from '@app/util/dola-staking';
import { getMulticallOutput } from '@app/util/multicall';
import { getChainlinkDolaUsdPrice, getDbrPriceOnCurve, getDolaUsdPriceOnCurve } from '@app/util/f2';
import { getWeekIndexUtc } from '@app/util/misc';
import { getOnChainData } from '../dola/sdola-comparator';
import { getBnToNumber } from '@app/util/markets';

export const dolaStakingCacheKey = `dola-staking-v1.0.4`;

export default async function handler(req, res) {
    const { cacheFirst, ignoreCache, includeSpectra } = req.query;
    const cacheDuration = 300;
    const isIncludeSpectra = includeSpectra === 'true';
    const cacheKey = isIncludeSpectra ? `${dolaStakingCacheKey}-spectra` : dolaStakingCacheKey;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache && ignoreCache !== 'true') {
            res.status(200).json(validCache);
            return
        }

        const provider = getProvider(CHAIN_ID);
        const savingsContract = getDolaSavingsContract(provider);
        const sDolaContract = getSdolaContract(provider);

        const weekIndexUtc = getWeekIndexUtc();

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
            { contract: sDolaContract, functionName: 'totalAssets' },
        ]);

        const promises = await Promise.allSettled([
            getDbrPriceOnCurve(provider),
            getChainlinkDolaUsdPrice(provider),
            getOnChainData([{ address: SDOLA_ADDRESS, isNotVault: false }]),
            isIncludeSpectra ? fetch(`https://yields.llama.fi/pools`).then(r => r.json()) : Promise.resolve({data:[]}),
        ]);

        const [
            dbrPriceData,
            dolaPriceData,
            historicalSDolaRates,
            llamaPools,
        ] = promises.map(p => p.status === 'fulfilled' ? p.value : undefined);

        const spectraItems = llamaPools?.data.filter(i => i.symbol === 'SDOLA' && i.underlyingTokens.length === 1 && i.project === 'spectra-v2');
        const highestSpectraPool = spectraItems?.reduce((acc: { apy: number, pool: any }, pool: any) => {
            return pool.apy > acc.apy ? {
                apy: pool.apy,
                pool: `https://app.spectra.finance/fixed-rate/eth:0x69ba1b7dba7eb3b7a73f4e35fd04a27ad06c55fe`,
            } : acc;
        }, {
            apy: 0,
            pool: null,
        });

        const { priceInDola: dbrDolaPrice } = dbrPriceData;
        const { price: dolaPriceUsd } = dolaPriceData;

        const resultData = {
            timestamp: Date.now(),
            spectraPool: highestSpectraPool,
            dolaPriceUsd,
            tvlUsd: getBnToNumber(dolaStakingData[9], 18) * dolaPriceUsd,
            ...historicalSDolaRates[0],
            ...formatDolaStakingData(dbrDolaPrice * dolaPriceUsd, dolaStakingData),
        }

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(dolaStakingCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ error: true });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: true });
        }
    }
}