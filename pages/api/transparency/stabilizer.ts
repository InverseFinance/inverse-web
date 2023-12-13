import { Event } from 'ethers'
import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { getStabilizerContract } from '@app/util/contracts';
import { addBlockTimestamps } from '@app/util/timestamps';

const getEventDetails = (log: Event, timestampInSec: number, includeTxHash: boolean) => {
    const { event, blockNumber, transactionHash, args } = log;
    const isBuy = event === 'Buy';
    const profit = isBuy ? getBnToNumber(args[2].sub(args[1])) : getBnToNumber(args[1].sub(args[2]))
    return {
        event,
        isBuy,
        blockNumber,
        profit,
        amount: getBnToNumber(args[1]),
        timestamp: timestampInSec * 1000,
        transactionHash: includeTxHash ? transactionHash : undefined,
    }
}

export default async function handler(req, res) {
    const cacheKey = `stabilizer-v1.0.2`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 300);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const provider = getProvider(NetworkIds.mainnet);
        const contract = getStabilizerContract(provider);

        const rawEvents = await Promise.all([
            contract.queryFilter(contract.filters.Buy()),
            contract.queryFilter(contract.filters.Sell()),
        ]);

        const events = rawEvents[0].concat(rawEvents[1]);
        // get timestamps for new blocks
        const blocks = events.map(e => e.blockNumber);
        const blockTimestamps = await addBlockTimestamps(blocks, NetworkIds.mainnet);        

        let totalAccumulated = 0;

        const includeTxHashIndex = events.length - 100;

        const totalEvents = events.sort((a, b) => a.blockNumber - b.blockNumber)
            .map((e, i) => {
                return getEventDetails(e, blockTimestamps[NetworkIds.mainnet][e.blockNumber], i >= includeTxHashIndex)
            })
            .map(event => {
                totalAccumulated += event.profit;
                return { ...event, newTotal: totalAccumulated }
            })

        const resultData = {
            totalEvents,
        }

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData);
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
