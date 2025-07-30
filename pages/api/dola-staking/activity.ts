
import 'source-map-support'
import { getPaidProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { ascendingEventsSorter } from '@app/util/misc';
import { formatDolaStakingEvents, getDolaSavingsContract, getSdolaContract } from '@app/util/dola-staking';
import { getLast100TxsOf } from '@app/util/covalent';
import { isAddress } from 'ethers/lib/utils';

const DOLA_STAKING_CACHE_KEY_ARCHIVED = 'dola-staking-v1.2.3'
const DOLA_STAKING_CACHE_KEY_NEO = 'dola-staking-v1.3.0'

export default async function handler(req, res) {
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { cacheFirst, account } = req.query;
    const _account = !!account && isAddress(account) ? account : undefined;
    const cacheKey = !!_account ? `${DOLA_STAKING_CACHE_KEY_NEO}-${_account}` : DOLA_STAKING_CACHE_KEY_NEO;
    try {            
        const { data: cachedDataNeo, isValid: isValidNeo } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
        if (!!cachedDataNeo && isValidNeo) {
            res.status(200).send(cachedDataNeo);
            return
        }

        let cachedDataArchived;

        const paidProvider = getPaidProvider(1);
        const sdolaContract = getSdolaContract(paidProvider);
        const dsaContract = getDolaSavingsContract(paidProvider);

        if(!cachedDataNeo) {
            const { data: _cachedDataArchived } = await getCacheFromRedisAsObj(DOLA_STAKING_CACHE_KEY_ARCHIVED, cacheFirst !== 'true', cacheDuration, true);
            cachedDataArchived = _cachedDataArchived;
        }

        const archived = cachedDataNeo || cachedDataArchived || { events: [] };
        let pastTotalEvents = archived?.events || [];
        if(!!_account && !cachedDataNeo) {
            pastTotalEvents = pastTotalEvents.filter(e => e.recipient === _account);
        }

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : { sDolaStaking: 0, totalDolaStaked: 0 };
        const newStartingBlock = lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : 0x0;

        const [
            stakeEventsData, unstakeEventsData, claimEventsData, depositEventsData, withdrawEventsData, sdolaTxs
        ] = await Promise.all([
            dsaContract.queryFilter(
                dsaContract.filters.Stake(undefined, _account),
                newStartingBlock,
            ),
            dsaContract.queryFilter(
                dsaContract.filters.Unstake(_account),
                newStartingBlock,
            ),
            dsaContract.queryFilter(
                dsaContract.filters.Claim(undefined, _account),
                newStartingBlock,
            ),
            sdolaContract.queryFilter(
                sdolaContract.filters.Deposit(undefined, _account),
                newStartingBlock,
            ),
            sdolaContract.queryFilter(
                sdolaContract.filters.Withdraw(undefined, _account),
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

        // always keep last 1000 events in cache
        const last1000 = pastTotalEvents.concat(newEvents).splice(-1000);
        // last 1000 add initiator data
        const last100 = last1000.splice(-100);
        const withInitiatorsForLast100 = last1000.concat(
            last100.map(e => ({
                ...e,
                txInitiator: e.txInitiator || txsWithFrom.find(tx => tx.txHash === e.transactionHash || tx.txHash === e.txHash)?.fromAddress,
            }))
        )

        const resultData = {
            timestamp: Date.now(),
            events: withInitiatorsForLast100,
        };

        await redisSetWithTimestamp(cacheKey, resultData, true);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false, 0, true);
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