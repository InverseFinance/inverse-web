import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID, SDOLA_ADDRESS } from '@app/config/constants';
import { dbrRewardRatesCacheKey, initialDbrRewardRates } from '../cron-dbr-distributor';
import { estimateBlockTimestamp, getTimestampFromUTCDate, timestampToUTC } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';
import { DBR_EMISSIONS_GROUPED_ARCHIVE } from '@app/fixtures/dbr-emissions-grouped';
// import { DBR_EMISSIONS_ARCHIVE } from '@app/fixtures/dbr-emissions';
// import { FORCED_REP_TXS } from '@app/fixtures/forced-rep-txs';

const { DBR, TREASURY } = getNetworkConfigConstants();

const getGroupedByDay = (newEvents) => {
    const uniqueDays = [...new Set(newEvents.map(ne => ne.utcDate))];

    return uniqueDays.map(utcDateString => {
        const eventsForDay = newEvents.filter(ne => ne.utcDate === utcDateString);
        const lastEvent = eventsForDay[eventsForDay.length - 1];
        return {
            blockNumber: lastEvent.blockNumber,
            timestamp: getTimestampFromUTCDate(utcDateString),
            utcDate: utcDateString,
            amount: eventsForDay.reduce((acc, ne) => {
                return acc + ne.amount;
            }, 0),
            sDolaClaimAmount: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isSDolaClaim ? ne.amount: (ne.sDolaClaimAmount||0));
            }, 0),
            treasuryMintAmount: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isTreasuryMint ? ne.amount: (ne.treasuryMintAmount||0));
            }, 0),
            treasuryTransferAmount: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isTreasuryTransfer ? ne.amount: (ne.treasuryTransferAmount||0));
            }, 0),
            forcedRepAmount: eventsForDay.reduce((acc, ne) => {
                return acc + (ne.isForcedRep ? ne.amount: (ne.forcedRepAmount||0));
            }, 0),
            accEmissions: lastEvent.accEmissions,
        }
    });
}

export default async function handler(req, res) {
    const cacheKey = `dbr-emissions-evolution-v1.0.2`;
    const { cacheFirst } = req.query;

    try {
        res.setHeader('Cache-Control', `public, max-age=${60}`);
        const [emissionsCacheRes, ratesCache] = await Promise.all([
            getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', 600, true),
            getCacheFromRedis(dbrRewardRatesCacheKey, false),
        ]);

        const { data: _cachedData, isValid } = emissionsCacheRes;

        if (!!_cachedData && isValid) {
            res.status(200).json({
                ..._cachedData,
                rewardRatesHistory: (ratesCache || initialDbrRewardRates),
            });
            return
        }

        const provider = getProvider(CHAIN_ID);
        const contract = new Contract(DBR, DBR_ABI, provider);
                
        const cachedData = _cachedData || DBR_EMISSIONS_GROUPED_ARCHIVE;
        const cachedGroupedEvents = (cachedData?.totalEmissions || []);
        let accEmissions = cachedGroupedEvents?.length ? cachedGroupedEvents[cachedGroupedEvents.length - 1].accEmissions : 0;

        const lastKnownEvent = cachedGroupedEvents?.length > 0 ? (cachedGroupedEvents[cachedGroupedEvents.length - 1]) : {};        
        const newStartingBlock = lastKnownEvent ? lastKnownEvent?.blockNumber + 1 : 0;
        const now = Date.now();

        const currentBlock = await provider.getBlockNumber();
        
        const [
            newMintEvents,
            newTreasuryTransferEvents,
            forcedRepEvents,
        ] = await Promise.all([
            getLargeLogs(
                contract,
                contract.filters.Transfer(BURN_ADDRESS),
                newStartingBlock ? newStartingBlock : undefined,
                currentBlock,
                10_000,
            ),
            contract.queryFilter(
                contract.filters.Transfer(TREASURY),
                newStartingBlock ? newStartingBlock : undefined,
            ),
            getLargeLogs(
                contract,
                contract.filters.ForceReplenish(),
                newStartingBlock ? newStartingBlock : undefined,
                currentBlock,
                10_000,
            ),
        ]);

        const newTransferEvents = newMintEvents.concat(newTreasuryTransferEvents).sort((a, b) => a.blockNumber - b.blockNumber);

        // const forcedRepTxHashes = FORCED_REP_TXS.concat(forcedRepEvents.map(e => e.transactionhash));
        const forcedRepTxHashes = forcedRepEvents.map(e => e.transactionhash);

        const newTransfers = newTransferEvents.map(e => {
            const timestamp = estimateBlockTimestamp(e.blockNumber, now, currentBlock);
            const utcDate = timestampToUTC(timestamp);
            const amount = getBnToNumber(e.args[2]);
            const isTreasuryTransfer = e.args[0].toLowerCase() === TREASURY.toLowerCase();
            if(!isTreasuryTransfer){
                accEmissions += amount;
            }
            return {
                utcDate,
                timestamp,
                blockNumber: e.blockNumber,
                amount,          
                accEmissions,
                isForcedRep: forcedRepTxHashes.includes(e.transactionHash),
                isSDolaClaim: e.args[1].toLowerCase() === SDOLA_ADDRESS.toLowerCase(),
                isTreasuryMint: e.args[1].toLowerCase() === TREASURY.toLowerCase(),
                isTreasuryTransfer,
            };
        }).filter(e => e.amount > 0);

        const resultData = {
            timestamp: now,
            isGroupedByDay: true,
            totalEmissions: newTransfers?.length ? getGroupedByDay(
                cachedData?.isGroupedByDay ? cachedGroupedEvents.concat(newTransfers) : cachedGroupedEvents.map(cge => ({...cge, isForcedRep: forcedRepTxHashes.includes(cge.txHash), utcDate: timestampToUTC(cge.timestamp) })).concat(newTransfers)
            ) : cachedGroupedEvents,
            rewardRatesHistory: (ratesCache || initialDbrRewardRates),
        };

        await redisSetWithTimestamp(cacheKey, resultData, true);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ status: 'ko' });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ status: 'ko' });
        }
    }
}