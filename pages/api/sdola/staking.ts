
import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { getDbrAuctionContract } from '@app/util/dbr-auction';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { CHAIN_ID } from '@app/config/constants';
import { ascendingEventsSorter } from '@app/util/misc';

const DOLA_STAKING_CACHE_KEY = 'dola-staking-v1.0.0'

export default async function handler(req, res) {
    try {
        const cacheDuration = 60;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DOLA_STAKING_CACHE_KEY, true, cacheDuration);
        if (!!cachedData && isValid) {
            res.status(200).send(cachedData);
            return
        }

        const provider = getProvider(CHAIN_ID);
        const dbrAuctionContract = getDbrAuctionContract(provider);

        const archived = cachedData || { events: [] };
        const pastTotalEvents = archived?.events || [];

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : {};
        const newStartingBlock = lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : undefined;

        const [
            stakeEventsData, unstakeEventsData, claimEventsData
        ] =  await Promise.all([
            dbrAuctionContract.queryFilter(
                dbrAuctionContract.filters.Stake(),            
                newStartingBlock ? newStartingBlock : 0x0,
            ),
            dbrAuctionContract.queryFilter(
                dbrAuctionContract.filters.Unstake(),            
                newStartingBlock ? newStartingBlock : 0x0,
            ),
            dbrAuctionContract.queryFilter(
                dbrAuctionContract.filters.Claim(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
        ]);

        const eventsData = stakeEventsData.concat(unstakeEventsData).concat(claimEventsData);
        const sortedEvents = eventsData.sort(ascendingEventsSorter);

        const blocks = sortedEvents.map(e => e.blockNumber);

        const timestamps = await addBlockTimestamps(
            blocks,
            '1',
        );

        const newEvents = sortedEvents.map(e => {
            return {
                txHash: e.transactionHash,
                timestamp: timestamps[NetworkIds.mainnet][e.blockNumber] * 1000,
                blockNumber: e.blockNumber,
                caller: e.args.caller,
                recipient: e.args.recipient,
                amount: getBnToNumber(e.args.amount||'0'),
                name: e.event,                
            };
        });

        const resultData = {
            timestamp: Date.now(),
            events: pastTotalEvents.concat(newEvents),
        };

        await redisSetWithTimestamp(DOLA_STAKING_CACHE_KEY, resultData);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(DOLA_STAKING_CACHE_KEY, false);
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