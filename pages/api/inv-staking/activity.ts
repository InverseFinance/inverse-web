
import 'source-map-support'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { CHAIN_ID, SINV_ADDRESS, SINV_ADDRESS_V1 } from '@app/config/constants';
import { ascendingEventsSorter } from '@app/util/misc';
import { formatInvStakingEvents, getSInvContract } from '@app/util/sINV';

const INV_STAKING_CACHE_KEY = 'inv-staking-activity-v1.0.2'

export default async function handler(req, res) {
    try {
        const cacheDuration = 120;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(INV_STAKING_CACHE_KEY, true, cacheDuration);
        if (!!cachedData && isValid) {
            res.status(200).send(cachedData);
            return
        }

        const provider = getPaidProvider(1);
        const sinvContract = getSInvContract(provider);
        const sinvContractV1 = getSInvContract(provider, SINV_ADDRESS_V1);

        const archived = cachedData || { events: [] };
        const pastTotalEvents = archived?.events || [];

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : { sInvStaking: 0, totalInvStaked: 0 };
        const newStartingBlock = lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : 0x0;

        const [
            stakeEventsData, unstakeEventsData, 
            stakeEventsDataV1, unstakeEventsDataV1,
        ] = await Promise.all([
            sinvContract.queryFilter(
                sinvContract.filters.Deposit(),
                newStartingBlock,
            ),
            sinvContract.queryFilter(
                sinvContract.filters.Withdraw(),
                newStartingBlock,
            ),
            sinvContractV1.queryFilter(
                sinvContractV1.filters.Deposit(),
                newStartingBlock,
            ),
            sinvContractV1.queryFilter(
                sinvContractV1.filters.Withdraw(),
                newStartingBlock,
            ),
        ]);

        const eventsData = stakeEventsData
            .concat(unstakeEventsData)
            .concat(SINV_ADDRESS_V1 !== SINV_ADDRESS ? stakeEventsDataV1 : [])
            .concat(SINV_ADDRESS_V1 !== SINV_ADDRESS ? unstakeEventsDataV1 : []);
        const sortedEvents = eventsData.sort(ascendingEventsSorter);

        const blocks = sortedEvents.map(e => e.blockNumber);

        const timestamps = await addBlockTimestamps(
            blocks,
            '1',
        );

        const newEvents = formatInvStakingEvents(
            sortedEvents,
            timestamps[NetworkIds.mainnet],
            lastKnownEvent.totalInvStaked,
            lastKnownEvent.sInvStaking,
        );

        const resultData = {
            timestamp: Date.now(),
            events: pastTotalEvents.concat(newEvents),
        };

        await redisSetWithTimestamp(INV_STAKING_CACHE_KEY, resultData);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(INV_STAKING_CACHE_KEY, false);
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