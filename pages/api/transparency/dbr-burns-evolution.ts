import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { estimateBlockTimestamp, getTimestampFromUTCDate, timestampToUTC } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';
import { DBR_BURNS_AGGREG_ARCHIVE } from '@app/fixtures/dbr-burns';

const { DBR } = getNetworkConfigConstants();

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
        accBurn: lastEvent.accBurn,
      }
    });
  }

export default async function handler(req, res) {
    const cacheKey = `dbr-burns-evolution-v1.0.0`;
    const { cacheFirst } = req.query;

    try {
        const cacheDuration = 1800;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const {isValid: validCache, data: _cachedData} = (await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, true));
        if (validCache) {
            res.status(200).json(_cachedData);
            return
        }

        const cachedData = _cachedData || DBR_BURNS_AGGREG_ARCHIVE;
        const cachedGroupedEvents = cachedData.totalBurns || [];
        let accBurn = cachedGroupedEvents?.length ? cachedGroupedEvents[cachedGroupedEvents.length - 1].accBurn : 0;

        const provider = getPaidProvider(CHAIN_ID);
        const contract = new Contract(DBR, DBR_ABI, provider);

        const lastItem = cachedGroupedEvents?.length > 0 ? (cachedGroupedEvents[cachedGroupedEvents.length - 1]) : {};
        const lastBlock = lastItem ? lastItem?.blockNumber : undefined;

        const now = Date.now();
        const currentBlock = await provider.getBlockNumber();

        const newBurnEvents = await getLargeLogs(
            contract,
            contract.filters.Transfer(undefined, BURN_ADDRESS),
            lastBlock + 1,
            currentBlock,
            10_000,
        );

        const newBurns = newBurnEvents.map(e => {
            const timestamp = estimateBlockTimestamp(e.blockNumber, now, currentBlock);
            const utcDate = timestampToUTC(timestamp);
            const amount = getBnToNumber(e.args[2]);
            accBurn += amount;
            return {
                timestamp,
                utcDate,
                blockNumber: e.blockNumber,
                amount,
                accBurn,
            };
        }).filter(e => e.amount > 0);

        const resultData = {
            timestamp: now,
            totalBurns: newBurns?.length ? getGroupedByDay(cachedGroupedEvents.concat(newBurns)) : cachedGroupedEvents,
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
            }
        } catch (e) {
            console.error(e);
        }
    }
}