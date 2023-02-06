import { Contract, Event } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, FedEvent, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { getRedisClient } from '@app/util/redis';
import { cacheDolaSupplies } from './dao';

const client = getRedisClient();

const getEvents = (fedAd: string, abi: string[], chainId: NetworkIds, startBlock = 0x0) => {
  const provider = getProvider(chainId);
  const contract = new Contract(fedAd, abi, provider);  
  return Promise.all([
    contract.queryFilter(contract.filters.Contraction(), startBlock),
    contract.queryFilter(contract.filters.Expansion(), startBlock),
  ])
}

const getTimestamps = (rawEvents: [Event[], Event[]], chainId: NetworkIds) => {
  const provider = getProvider(chainId);
  const events = rawEvents[0].concat(rawEvents[1]);
  return Promise.all(
    events.map(rawEvent => provider.getBlock(rawEvent.blockNumber))
  )
}

const getEventDetails = (log: Event, timestampInSec: number, fedIndex: number, isFirm?: boolean) => {
  const { event, blockNumber, transactionHash, args } = log;
  const isContraction = event === 'Contraction';
  const amountBn = isFirm ? args![1] : args![0];
  return {
    event,
    fedIndex,
    isContraction,
    blockNumber,
    transactionHash,
    args,
    value: getBnToNumber(amountBn) * (isContraction ? -1 : 1),
    timestamp: timestampInSec * 1000,
  }
}

export default async function handler(req, res) {

  const { FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);
  // to keep for archive
  const cacheKeyOld = `fed-policy-cache-v1.0.95`;  
  // temp migration
  const cacheKeyNew = `fed-policy-cache-v1.0.96`;  

  try {

    const validCache = await getCacheFromRedis(cacheKeyNew, true, 900);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const archived = await getCacheFromRedis(cacheKeyOld, false);
    const pastTotalEvents = archived?.totalEvents || [];

    const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : {};
    const newStartingBlock = lastKnownEvent ? lastKnownEvent?.blockNumber + 1 : 0;

    const rawEvents = await Promise.all([
      ...FEDS.map(fed =>
        fed.hasEnded ?
          new Promise((res) => res([[], []]))
          : getEvents(fed.address, fed.abi, fed.chainId, newStartingBlock)
      )
    ]);

    // add old Convex Fed to Convex Fed
    let withOldAddresses: (Fed & { oldAddress: string })[] = [];
    FEDS.filter(fed => !!fed.oldAddresses).forEach(fed => {
      fed.oldAddresses?.forEach(oldAddress => withOldAddresses.push({ ...fed, oldAddress }));
    });

    const oldRawEvents = await Promise.all([
      ...withOldAddresses.map(fed => getEvents(fed.oldAddress, fed.abi, fed.chainId, newStartingBlock))
    ]);

    withOldAddresses.forEach((fed, i) => {
      const fedIndex = FEDS.findIndex(f => f.name === fed.name);
      rawEvents[fedIndex][0] = rawEvents[fedIndex][0].concat(oldRawEvents[i][0]);
      rawEvents[fedIndex][1] = rawEvents[fedIndex][1].concat(oldRawEvents[i][1]);
    });

    const blockTimestamps: { [key: string]: { [key: string]: number } } = JSON.parse(await client.get('block-timestamps') || '{}');

    // first time
    if (!blockTimestamps[NetworkIds.mainnet]) {
      const timestamps = await Promise.all([
        ...FEDS.map((fed, i) => getTimestamps(rawEvents[i], fed.chainId))
      ]);
      FEDS.forEach((fed, fedIndex) => {
        const events = rawEvents[fedIndex][0].concat(rawEvents[fedIndex][1]);
        events.forEach((event, eventIndex) => {
          if (!blockTimestamps[fed.chainId]) {
            blockTimestamps[fed.chainId] = {};
          }
          blockTimestamps[fed.chainId][event.blockNumber] = timestamps[fedIndex][eventIndex].timestamp;
        })
      })
    }

    // get timestamps for new blocks
    for (let [fedIndex, fed] of FEDS.entries()) {
      const events = rawEvents[fedIndex][0].concat(rawEvents[fedIndex][1]);
      const provider = getProvider(fed.chainId);
      for (let event of events) {
        if (!blockTimestamps[fed.chainId]) {
          blockTimestamps[fed.chainId] = {};
        }
        if (!blockTimestamps[fed.chainId][event.blockNumber]) {
          const block = await provider.getBlock(event.blockNumber);
          blockTimestamps[fed.chainId][event.blockNumber] = block.timestamp;
        }
      }
    }

    let totalAccumulatedSupply = lastKnownEvent?.newTotalSupply || 0;

    let _key = lastKnownEvent?._key ? lastKnownEvent?._key + 1 : 0;

    let accumulatedSupplies = {};
    FEDS.forEach((fed, i) => {
      // no array findLast method in this node version
      const fedEvents = pastTotalEvents.filter(event => event.fedIndex === i);
      const lastEvent = fedEvents?.length > 0 ? fedEvents[fedEvents.length - 1] : {};
      if (lastEvent) {
        accumulatedSupplies[fed.address] = lastEvent.newSupply || 0;
      }
    })

    const newEvents = FEDS
      .map((fed, fedIndex) => {
        return {
          ...fed,
          events: rawEvents[fedIndex][0].concat(rawEvents[fedIndex][1])
            .sort((a, b) => a.blockNumber - b.blockNumber)
            .map(e => {
              return getEventDetails(e, blockTimestamps[fed.chainId][e.blockNumber], fedIndex, fed.isFirm)
            })
            .map(e => {
              accumulatedSupplies[fed.address] += e.value;
              // case where profits where made => can contract more than what was expanded in the first place
              if (accumulatedSupplies[fed.address] < 0) {
                accumulatedSupplies[fed.address] = 0;
              }
              return { ...e, newSupply: accumulatedSupplies[fed.address] }
            })
        }
      })
      .reduce((prev, curr) => prev.concat(curr.events), [] as FedEvent[])
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(event => {
        totalAccumulatedSupply += event.value
        return { ...event, newTotalSupply: totalAccumulatedSupply, _key: _key++ }
      })

    const fedPolicyMsg = JSON.parse((await client.get('fed-policy-msg')) || '{"msg": "No guidance at the moment","lastUpdate": ' + Date.now() + '}');

    const dolaSuppliesCacheData = (await getCacheFromRedis(cacheDolaSupplies, false)) || { dolaSupplies: [], dolaTotalSupply: 0 };

    // temp => migrate data to add fed address to data
    const totalEvents = pastTotalEvents.concat(newEvents).map(event => {
      return { ...event, fedAddress: FEDS[event.fedIndex].address }
    });

    const resultData = {
      timestamp: +(new Date()),
      fedPolicyMsg,
      totalEvents,
      feds: FEDS.map(fed => {
        return { ...fed, supply: accumulatedSupplies[fed.address] }
      }),
      dolaSupplies: dolaSuppliesCacheData?.dolaSupplies,
    }

    await client.set('block-timestamps', JSON.stringify(blockTimestamps));

    await redisSetWithTimestamp(cacheKeyNew, resultData);

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
