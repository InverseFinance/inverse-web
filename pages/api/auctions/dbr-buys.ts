
import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { getDbrAuctionContract } from '@app/util/dbr-auction';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { CHAIN_ID } from '@app/config/constants';

const DBR_AUCTION_CACHE_KEY = 'dbr-auction-v1.0.0'

export default async function handler(req, res) {
    try {
        const cacheDuration = 60;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DBR_AUCTION_CACHE_KEY, true, cacheDuration);
        if (!!cachedData && isValid) {
            res.status(200).send(cachedData);
            return
        }

        const provider = getProvider(CHAIN_ID);
        const dbrAuctionContract = getDbrAuctionContract(provider);

        const archived = cachedData || { buys: [] };
        const pastTotalEvents = archived?.buys || [];

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : {};
        const newStartingBlock = lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : undefined;

        const newBuyEvents = await dbrAuctionContract.queryFilter(
            dbrAuctionContract.filters.Buy(),            
            newStartingBlock ? newStartingBlock : 0x0,
        );

        const blocks = newBuyEvents.map(e => e.blockNumber);

        const timestamps = await addBlockTimestamps(
            blocks,
            '1',
        );

        const newBuys = newBuyEvents.map(e => {
            return {
                txHash: e.transactionHash,
                timestamp: timestamps[NetworkIds.mainnet][e.blockNumber] * 1000,
                blockNumber: e.blockNumber,
                caller: e.args[0],
                to: e.args[1],
                dolaIn: getBnToNumber(e.args[2]),
                dbrOut: getBnToNumber(e.args[3]),
            };
        });

        const resultData = {
            timestamp: Date.now(),
            buys: pastTotalEvents.concat(newBuys),
        };

        await redisSetWithTimestamp(DBR_AUCTION_CACHE_KEY, resultData);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(DBR_AUCTION_CACHE_KEY, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).send(cache);
            } else {
                res.status(500).send({})
            }
        } catch (e) {
            console.error(e);
            res.status(500).send({})
        }
    }
}