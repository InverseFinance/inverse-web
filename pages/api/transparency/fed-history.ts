import { Contract, Event } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@inverse/util/redis'
import { NetworkIds } from '@inverse/types';
import { getBnToNumber } from '@inverse/util/markets'

const getEvents = (fedAd: string, abi: string[], chainId: NetworkIds) => {
  const provider = getProvider(chainId);
  const contract = new Contract(fedAd, abi, provider);
  return Promise.all([
    contract.queryFilter(contract.filters.Contraction()),
    contract.queryFilter(contract.filters.Expansion()),
  ])
}

const getEventDetails = (log: Event) => {
  const { event, blockNumber, transactionHash, args } = log;
  const isContraction = event === 'Contraction';
  return {
    event,
    isContraction,
    blockNumber,
    transactionHash,
    value: getBnToNumber(args![0]) * (isContraction ? -1 : 1),
  }
}

export default async function handler(req, res) {

  const { FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `fed-history-cache-v1.0.0`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 600);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const rawEvents = await Promise.all([
      ...FEDS.map(fed => getEvents(fed.address, fed.abi, fed.chainId))
    ]);

    const resultData = {
      feds: FEDS.map((fed, i) => {
        let accumulatedSupply = 0;

        const events = rawEvents[i][0]
          .concat(rawEvents[i][1])
          .map(event => getEventDetails(event))
          .sort((a, b) => a.blockNumber - b.blockNumber)
          .map(event => {
            accumulatedSupply += event.value;
            return { ...event, newSupply: accumulatedSupply }
          })

          events.sort((a, b) => b.blockNumber - a.blockNumber);

        return {
          ...fed,
          abi: undefined,
          events,
        }
      })
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
