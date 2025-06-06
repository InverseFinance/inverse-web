import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { NetworkIds } from '@app/types';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { DOLA_CIRC_SUPPLY_EVO_CACHE_KEY } from './circulating-supply-evolution';
import { fillMissingDailyDatesWithMostRecentData, timestampToUTC } from '@app/util/misc';
import { getGroupedMulticallOutputs } from '@app/util/multicall';

const { F2_MARKETS, DOLA, FEDS } = getNetworkConfigConstants();

const mainnetExcludedAddresses = [
  // AN_DOLA
  '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
  ...F2_MARKETS.map(m => m.address),
];

const l2ExcludedAddressesAndChains = [
  ...FEDS.filter(fed => !!fed.incomeChainId && !!fed.incomeSrcAd).map(fed => {
    return [fed.incomeSrcAd, fed.incomeChainId];
  }),
];

export const dolaCircSupplyCacheKey = `dola-circ-supply-v1.0.1`;

export default async function handler(req, res) {
  const { cacheFirst } = req.query;

  try {
    const cacheDuration = 120;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(dolaCircSupplyCacheKey, cacheFirst !== 'true', cacheDuration);
    const isSaveCircSupply = req.method === 'POST' || req.query.saveCircSupply === 'true';

    if (validCache && !isSaveCircSupply) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const mainnetContract = new Contract(DOLA, DOLA_ABI, provider);

    const [
      totalSupplyBn,
      mainnetExcludedBnb
    ] = await getGroupedMulticallOutputs([
      { contract: mainnetContract, functionName: 'totalSupply' },
      mainnetExcludedAddresses.map(excludedData => {
        // if excludedData is an array we have a startingBlock
        return {
          contract: mainnetContract,
          functionName: 'balanceOf',
          params: [Array.isArray(excludedData) ? excludedData[0] : excludedData],
        }
      }),
    ]);

    const l2ExcludedBalances = await Promise.all(
      l2ExcludedAddressesAndChains.map(excludedData => {
        const contract = Array.isArray(excludedData) ?
          new Contract(getToken(CHAIN_TOKENS[excludedData[1]], 'DOLA').address!, DOLA_ABI, getProvider(excludedData[1]))
          :
          mainnetContract;
        const excludedAd = Array.isArray(excludedData) ? excludedData[0] : excludedData;
        return contract.balanceOf(excludedAd);
      })
    );

    const totalSupply = getBnToNumber(totalSupplyBn);
    const mainnetExcludedTotal = mainnetExcludedBnb
      .map(bn => getBnToNumber(bn))
      .reduce((prev, curr) => prev + curr, 0);

    const farmersExcludedTotal = l2ExcludedBalances
      .map(bn => getBnToNumber(bn))
      .reduce((prev, curr) => prev + curr, 0);

    const totalDolaExcluded = mainnetExcludedTotal + farmersExcludedTotal;
    const circSupply = totalSupply - totalDolaExcluded;

    await redisSetWithTimestamp(dolaCircSupplyCacheKey, circSupply);

    // daily cron job case: add daily data to evolution data
    if (isSaveCircSupply) {
      const cachedCircEvoData = (await getCacheFromRedis(DOLA_CIRC_SUPPLY_EVO_CACHE_KEY, false)) || { evolution: [] };
      const timestamp = Date.now();
      const utcDate = timestampToUTC(timestamp);
      const alreadyThere = cachedCircEvoData.evolution.find(evo => evo.utcDate === utcDate);      

      if(!alreadyThere) {
        cachedCircEvoData.evolution.push({
          utcDate,
          totalSupply,
          circSupply,          
          mainnetExcluded: mainnetExcludedTotal,
          farmersExcluded: farmersExcludedTotal,
        });
        // in case we missed a day, fill with most recent data
        const filledIn = fillMissingDailyDatesWithMostRecentData(cachedCircEvoData.evolution, 1);
        const results = {
          timestamp,
          lastUtcDate: utcDate,
          evolution: filledIn.filter(d => d.utcDate <= utcDate).map(evo => {
            return { utcDate: evo.utcDate, totalSupply: evo.totalSupply, circSupply: evo.circSupply, mainnetExcluded: evo.mainnetExcluded, farmersExcluded: evo.farmersExcluded }
          }),
        }
        await redisSetWithTimestamp(DOLA_CIRC_SUPPLY_EVO_CACHE_KEY, results);
      }      
    }

    res.status(200).send(circSupply);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(dolaCircSupplyCacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch (e) {
      console.error(e);
      res.status(500);
    }
  }
}