import { Contract, Event } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, FedEvent, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { cacheDolaSupplies } from './dao';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { ONE_DAY_MS } from '@app/config/constants';

const getEvents = (fedAd: string, abi: string[], chainId: NetworkIds, startBlock = 0x0) => {
  const provider = chainId?.toString() === '1' ? getPaidProvider(1) : getProvider(chainId);
  const contract = new Contract(fedAd, abi, provider);
  return Promise.all([
    contract.queryFilter(contract.filters.Contraction(), startBlock),
    contract.queryFilter(contract.filters.Expansion(), startBlock),
  ])
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
    value: getBnToNumber(amountBn) * (isContraction ? -1 : 1),
    timestamp: timestampInSec * 1000,
  }
}

const ARCHIVE_DAYS_DIFF = ONE_DAY_MS * 30;

export default async function handler(req, res) {
  const { cacheFirst } = req.query;

  const { FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);
  // we keep two cache entries, one "archived" that is up to ~30 days old and one "current"
  // makes potential fed migrations easier
  const archiveKey = `fed-policy-cache-v1.2.0`;
  const cacheKey = `fed-policy-cache-v1.2.1`;

  try {
    const cacheDuration = 120;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }
    
    const { data: archived, timestamp: archiveTimestamp } = await getCacheFromRedisAsObj(archiveKey, cacheFirst !== 'true', cacheDuration);
    const _pastTotalEvents = archived?.totalEvents || [];
    let pastTotalEvents;
    // Euler Fed closure fixture (no Contraction event was emitted)
    if (false && !_pastTotalEvents.find(e => e.txHash === '0xd402c7521272ea2ff718a8706a79aedf4c916208a6f3e8172aae4ffb54338e2f' && e.value < 0)) {
      pastTotalEvents = _pastTotalEvents.filter(e => e.timestamp < 1688663111000);
      const lastEventBeforeEulerFedClosure = pastTotalEvents[pastTotalEvents.length - 1];
      const eulerFedClosure = {
        "event": "Contraction",
        "fedIndex": 11,
        "isContraction": true,
        "blockNumber": 17636172,
        "transactionHash": "0xd402c7521272ea2ff718a8706a79aedf4c916208a6f3e8172aae4ffb54338e2f",
        "value": -854752.437712229,
        "timestamp": 1688663111000,
        "newSupply": 0,
        "newTotalSupply": lastEventBeforeEulerFedClosure.newTotalSupply - 854752.437712229,
        "_key": lastEventBeforeEulerFedClosure._key + 1,
        "fedAddress": "0xab4AE477899fD61B27744B4DEbe8990C66c81C22",
      }
      pastTotalEvents.push(eulerFedClosure);
    } else {
      pastTotalEvents = _pastTotalEvents;
    }

    const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : {};
    const newStartingBlock = lastKnownEvent ? lastKnownEvent?.blockNumber + 1 : 0;

    const rawEvents = await Promise.all([
      ...FEDS.map(fed => {
        const pastFedEvents = pastTotalEvents?.filter(e => e.fedAddress === fed.address) || [];
        const lastKnownFedEvent = pastFedEvents.length > 0 ? (pastFedEvents[pastFedEvents.length - 1]) : {};
        const newStartingBlock = lastKnownFedEvent ? lastKnownFedEvent?.blockNumber + 1 : 0;
        return fed.hasEnded ?
          new Promise((res) => res([[], []]))
          : getEvents(fed.address, fed.abi, fed.chainId, !pastFedEvents.find(e => e.fedAddress === fed.address) ? 0x0 : newStartingBlock)
      }
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

    // get timestamps for new blocks
    let blocksToAddPerChainId = {};
    for (let [fedIndex, fed] of FEDS.entries()) {
      const events = rawEvents[fedIndex][0].concat(rawEvents[fedIndex][1]);
      const blocks = [...new Set(events.map(e => e.blockNumber))];
      blocksToAddPerChainId[fed.chainId] = blocksToAddPerChainId[fed.chainId] ? [...new Set(blocksToAddPerChainId[fed.chainId].concat(blocks))] : blocks;
    }
    const timestampsToAddPerChain = Object.keys(blocksToAddPerChainId);
    for (let chainId of timestampsToAddPerChain) {
      await addBlockTimestamps(blocksToAddPerChainId[chainId], chainId as NetworkIds);
    }
    const blockTimestamps = await getCachedBlockTimestamps();

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
              return {
                ...e,
                newSupply: accumulatedSupplies[fed.address]||0,
              }
            })
        }
      })
      .reduce((prev, curr) => prev.concat(curr.events), [] as FedEvent[])
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(event => {
        return {
          ...event,
          _key: _key++
        }
      })

    const fedPolicyMsg = { "msg": "No guidance at the moment", "lastUpdate": 1664090872336 };

    const dolaSuppliesCacheData = (await getCacheFromRedis(cacheDolaSupplies, false)) || { dolaSupplies: [], dolaTotalSupply: 0 };

    // newTotalSupply fix and reconstruction
    accumulatedSupplies = {};
    const totalEvents = pastTotalEvents.concat(newEvents).map(event => {
      const fedAddress = FEDS[event.fedIndex].address;
      accumulatedSupplies[fedAddress] = event.newSupply;
      return {
        ...event,
        fedAddress,
        newTotalSupply: Object.values(accumulatedSupplies).reduce((prev, curr) => prev + curr, 0),
      }
    });

    const now = Date.now();

    const resultData = {
      timestamp: now,
      fedPolicyMsg,
      totalEvents,
      feds: FEDS.map(fed => {
        const accSupply = accumulatedSupplies[fed.address]||0;
        return { ...fed, supply: accSupply < 1 ? 0 : accSupply, strategy: undefined }
      }),
      dolaSupplies: dolaSuppliesCacheData?.dolaSupplies,
    }

    // update archive cache if it's been more than 30 days
    if((now - archiveTimestamp) >= ARCHIVE_DAYS_DIFF) {
      await redisSetWithTimestamp(archiveKey, resultData);
    }
    await redisSetWithTimestamp(cacheKey, resultData);

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
