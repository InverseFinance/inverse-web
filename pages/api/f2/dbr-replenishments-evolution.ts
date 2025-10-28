import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { DBR_REP_ARCHIVE } from '@app/fixtures/replenishments2';
import { estimateBlockTimestamp, getTimestampFromUTCDate, timestampToUTC } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';

const { DBR } = getNetworkConfigConstants();

export const dbrReplenishmentsEvolutionCacheKey = `dbr-replenishments-evolution-v1.0.3`;

const getGroupedByDayReplenishments = (newEvents) => {
  const uniqueDays = [...new Set(newEvents.map(ne => ne.utcDate))];

  return uniqueDays.map(utcDateString => {
    const eventsForDay = newEvents.filter(ne => ne.utcDate === utcDateString);
    const lastEvent = eventsForDay[eventsForDay.length - 1];
    return {
      blockNumber: lastEvent.blockNumber,
      timestamp: getTimestampFromUTCDate(utcDateString),
      utcDate: utcDateString,
      deficit: eventsForDay.reduce((acc, ne) => {
        return acc + ne.deficit;
      }, 0),
      // replenishmentCost: eventsForDay.reduce((acc, ne) => {
      //   return acc + ne.replenishmentCost;
      // }, 0),
      // replenisherReward: eventsForDay.reduce((acc, ne) => {
      //   return acc + ne.replenisherReward;
      // }, 0),
      daoFeeAcc: lastEvent.daoFeeAcc,
      daoDolaReward: eventsForDay.reduce((acc, ne) => {
        return acc + ne.daoDolaReward;
      }, 0),
    }
  });
}

export default async function handler(req, res) {
  try {
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    const { isValid, data: _cachedData } = await getCacheFromRedisAsObj(dbrReplenishmentsEvolutionCacheKey, true, cacheDuration, true);
    if (isValid) {
      res.status(200).json(_cachedData);
      return
    }
    const cachedData = _cachedData || DBR_REP_ARCHIVE;

    const provider = getPaidProvider(CHAIN_ID);

    const dbrContract = new Contract(DBR, DBR_ABI, provider);
    const lastBlock = cachedData?.events?.length ? cachedData?.events[cachedData.events.length - 1].blockNumber : undefined;

    const currentBlock = await provider.getBlockNumber();
    const now = Date.now();

    const events = await getLargeLogs(
      dbrContract,
      dbrContract.filters.ForceReplenish(),
      lastBlock + 1,
      currentBlock,
      10_000,
    );

    const cachedEvents = cachedData?.events || [];

    let daoFeeAcc = cachedEvents?.length ? cachedEvents[cachedEvents.length - 1].daoFeeAcc : 0;

    const newEvents = events.map(e => {
      const replenishmentCost = getBnToNumber(e.args?.replenishmentCost);
      const replenisherReward = getBnToNumber(e.args?.replenisherReward);
      const daoDolaReward = replenishmentCost - replenisherReward;
      daoFeeAcc += daoDolaReward;
      const timestamp = estimateBlockTimestamp(e.blockNumber, now, currentBlock);
      const utcDate = timestampToUTC(timestamp);
      return {
        blockNumber: e.blockNumber,
        timestamp,
        utcDate,
        deficit: getBnToNumber(e.args?.deficit),
        replenishmentCost,
        replenisherReward,
        daoDolaReward,
        daoFeeAcc,
      }
    });

    const newGroupedData = newEvents?.length ? (cachedData?.isGroupedByDay ?
      getGroupedByDayReplenishments(cachedEvents.concat(newEvents))
      : getGroupedByDayReplenishments(
        cachedEvents.map(e => ({ ...e, utcDate: timestampToUTC(e.timestamp) })).concat(newEvents)
      )) : cachedEvents;

    const resultData = {
      timestamp: now,
      isGroupedByDay: true,
      events: newGroupedData,
    }

    await redisSetWithTimestamp(dbrReplenishmentsEvolutionCacheKey, resultData, true);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(dbrReplenishmentsEvolutionCacheKey, false, 0, true);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      } else {
        res.status(500).json({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}