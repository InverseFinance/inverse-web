
import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { CHAIN_ID } from '@app/config/constants';
import { ascendingEventsSorter } from '@app/util/misc';
import { formatDolaStakingEvents, getDolaSavingsContract, getSdolaContract } from '@app/util/dola-staking';

const DOLA_STAKING_CACHE_KEY = 'dola-staking-v1.0.1'

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
        const sdolaContract = getSdolaContract(provider);
        const dsaContract = getDolaSavingsContract(provider);

        const archived = cachedData || { events: [] };
        const pastTotalEvents = archived?.events || [];

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : { sDolaStaking: 0, totalDolaStaked: 0 };
        const newStartingBlock = lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : 0x0;

        const [
            stakeEventsData, unstakeEventsData, claimEventsData, depositEventsData, withdrawEventsData
        ] = await Promise.all([
            dsaContract.queryFilter(
                dsaContract.filters.Stake(),
                newStartingBlock,
            ),
            dsaContract.queryFilter(
                dsaContract.filters.Unstake(),
                newStartingBlock,
            ),
            dsaContract.queryFilter(
                dsaContract.filters.Claim(),
                newStartingBlock,
            ),
            sdolaContract.queryFilter(
                sdolaContract.filters.Deposit(),
                newStartingBlock,
            ),
            sdolaContract.queryFilter(
                sdolaContract.filters.Withdraw(),
                newStartingBlock,
            ),
        ]);

        const eventsData = stakeEventsData
            .concat(unstakeEventsData)
            .concat(claimEventsData)
            .concat(depositEventsData)
            .concat(withdrawEventsData);
        const sortedEvents = eventsData.sort(ascendingEventsSorter);

        const blocks = sortedEvents.map(e => e.blockNumber);

        const timestamps = await addBlockTimestamps(
            blocks,
            '1',
        );

        const newEvents = formatDolaStakingEvents(
            sortedEvents,
            timestamps[NetworkIds.mainnet],
            lastKnownEvent.totalDolaStaked,
            lastKnownEvent.sDolaStaking,
        );

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