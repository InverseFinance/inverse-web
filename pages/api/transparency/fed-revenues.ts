import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI } from '@app/config/abis'
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';

export default async function handler(req, res) {

    const { DOLA, FEDS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);
    const ftmConfig = getNetworkConfig(NetworkIds.ftm, false);
    const cacheKey = `revenues-v1.0.0`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 300);
        if (validCache) {
          res.status(200).json(validCache);
          return
        }

        const feds = FEDS.filter(fed => fed.chainId === NetworkIds.mainnet);

        const transfers = await Promise.all([
            ...feds.map((fed: Fed) => {
                const provider = getProvider(fed.chainId, undefined, true);
                const dolaContract = new Contract(fed.chainId === NetworkIds.mainnet ? DOLA : ftmConfig?.DOLA!, DOLA_ABI, provider);
                return dolaContract.queryFilter(dolaContract.filters.Transfer(fed.address, TREASURY));
            }),
        ]);

        for(let [fedIndex, fed] of feds.entries()) {
            await addBlockTimestamps(transfers[fedIndex].map(t => t.blockNumber), fed.chainId);
        }

        const blockTimestamps = await getCachedBlockTimestamps();

        const accProfits: { [key: string]: number } = {};

        const fedRevenues = transfers.map((fedTransfers, fedIndex) => {
            const fedAd = feds[fedIndex].address;
            if (!accProfits[fedAd]) { accProfits[fedAd] = 0 }
            return fedTransfers.map(t => {
                const profit = getBnToNumber(t.args[2]);
                accProfits[fedAd] += profit;
                return { ...t, timestamp: blockTimestamps[feds[fedIndex].chainId][t.blockNumber], profit, accProfit: accProfits[fedAd] };
            })
        });

        const resultData = {
            totalEvents: fedRevenues,
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
            res.status(500).send('')
            console.error(e);
        }
    }
}