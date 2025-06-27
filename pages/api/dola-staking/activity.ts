
import 'source-map-support'
import { getPaidProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { ascendingEventsSorter } from '@app/util/misc';
import { formatDolaStakingEvents, getDolaSavingsContract, getSdolaContract } from '@app/util/dola-staking';
import { getLast100TxsOf } from '@app/util/covalent';

const DOLA_STAKING_CACHE_KEY = 'dola-staking-v1.1.0'
const DOLA_STAKING_CACHE_KEY_NEO = 'dola-staking-v1.2.2'

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    try {
        const cacheDuration = 300;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DOLA_STAKING_CACHE_KEY, false, cacheDuration, true);
        const { data: cachedDataNeo, isValid: isValidNeo } = await getCacheFromRedisAsObj(DOLA_STAKING_CACHE_KEY_NEO, cacheFirst !== 'true', cacheDuration, true);
        if (!!cachedDataNeo && isValidNeo) {
            res.status(200).send(cachedDataNeo);
            return
        }

        const paidProvider = getPaidProvider(1);
        const sdolaContract = getSdolaContract(paidProvider);
        const dsaContract = getDolaSavingsContract(paidProvider);

        const archived = cachedDataNeo || cachedData || { events: [] };
        const pastTotalEvents = archived?.events || [];

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : { sDolaStaking: 0, totalDolaStaked: 0 };
        const newStartingBlock = lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : 0x0;

        const [
            stakeEventsData, unstakeEventsData, claimEventsData, depositEventsData, withdrawEventsData, sdolaTxs
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
            getLast100TxsOf(sdolaContract.address, '1', true, true),
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

        const txsWithFrom = (sdolaTxs?.data?.items || []).map(tx => ({ txHash: tx.tx_hash, fromAddress: tx.from_address })) || [];

        const newEvents = formatDolaStakingEvents(
            sortedEvents,
            timestamps[NetworkIds.mainnet],
            lastKnownEvent.totalDolaStaked,
            lastKnownEvent.sDolaStaking,
            txsWithFrom,
        );

        const allEvents = pastTotalEvents.concat(newEvents);
        const last100 = allEvents.splice(-100);
        // now allEvents has 100 less
        const withInitiatorsForLast100 = allEvents.concat(
            last100.map(e => ({
                ...e,
                txInitiator: e.txInitiator || txsWithFrom.find(tx => tx.txHash === e.transactionHash)?.fromAddress,
            }))
        )

        const resultData = {
            timestamp: Date.now(),
            events: withInitiatorsForLast100,
        };

        await redisSetWithTimestamp(DOLA_STAKING_CACHE_KEY_NEO, resultData, true);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(DOLA_STAKING_CACHE_KEY_NEO, false, 0, true);
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