import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { CHAIN_ID, JDOLA_AUCTION_ADDRESS, ONE_DAY_MS, SDOLA_ADDRESS } from '@app/config/constants';
import { formatDolaStakingData, getDolaSavingsContract, getSdolaContract } from '@app/util/dola-staking';
import { getMulticallOutput } from '@app/util/multicall';
import { getDbrPriceOnCurve, getDolaUsdPriceOnCurve } from '@app/util/f2';
import { getWeekIndexUtc } from '@app/util/misc';
import { getOnChainData } from '../dola/sdola-comparator';
import { getBnToNumber } from '@app/util/markets';
import { formatJDolaStakingData, getJdolaContract, getJuniorEscrowContract } from '@app/util/junior';
import { JsonRpcProvider } from '@ethersproject/providers';

export const jdolaStakingCacheKey = `jdola-staking-v1.0.0`;

export default async function handler(req, res) {
    const { cacheFirst, ignoreCache, includeSpectra } = req.query;
    const cacheDuration = 900;
    const isIncludeSpectra = includeSpectra === 'true';
    const cacheKey = isIncludeSpectra ? `${jdolaStakingCacheKey}-spectra` : jdolaStakingCacheKey;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        // if (validCache && ignoreCache !== 'true') {
        //     res.status(200).json(validCache);
        //     return
        // }

        // const provider = getProvider(CHAIN_ID);
        const provider = new JsonRpcProvider("https://virtual.mainnet.eu.rpc.tenderly.co/a6100ef2-1d15-4265-aa70-d9dfad68fec1");
        const jDolaContract = getJdolaContract(provider);
        const escrowContract = getJuniorEscrowContract(provider);

        const weekIndexUtc = getWeekIndexUtc();

        const jdolaStakingData = await getMulticallOutput([
            { contract: jDolaContract, functionName: 'totalSupply' },
            { contract: jDolaContract, functionName: 'yearlyRewardBudget' },
            { contract: jDolaContract, functionName: 'maxYearlyRewardBudget' },
            { contract: jDolaContract, functionName: 'maxDbrDolaRatioBps' },
            { contract: jDolaContract, functionName: 'weeklyRevenue', params: [weekIndexUtc] },
            { contract: jDolaContract, functionName: 'weeklyRevenue', params: [weekIndexUtc - 1] },
            { contract: jDolaContract, functionName: 'totalAssets' },
            { contract: escrowContract, functionName: 'exitWindow' },
            { contract: escrowContract, functionName: 'withdrawFeeBps' },
        ]);

        const promises = await Promise.allSettled([
            getDbrPriceOnCurve(provider),
            getDolaUsdPriceOnCurve(provider),
            getOnChainData([{ address: JDOLA_AUCTION_ADDRESS, isNotVault: false }]),
        ]);

        const [
            dbrPriceData,
            dolaPriceData,
            historicalSDolaRates,
        ] = promises.map(p => p.status === 'fulfilled' ? p.value : undefined);

        const { priceInDola: dbrDolaPrice } = dbrPriceData;
        const { price: dolaPriceUsd } = dolaPriceData;

        const resultData = {
            timestamp: Date.now(),
            dolaPriceUsd,
            tvlUsd: getBnToNumber(jdolaStakingData[7], 18) * dolaPriceUsd,
            ...historicalSDolaRates[0],
            ...formatJDolaStakingData(dbrDolaPrice * dolaPriceUsd, jdolaStakingData),
        }

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(jdolaStakingCacheKey, false);
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