import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { getBnToNumber, getHistoricalTokenData } from '@app/util/markets';
import { getMulticallOutput } from '@app/util/multicall';
import { Contract } from 'ethers';
import { VE_NFT_ABI } from '@app/config/abis';
import { getHistoricalProvider } from '@app/util/providers';
import { getClosestPreviousHistoValue, timestampToUTC } from '@app/util/misc';

export default async function handler(req, res) {
  const cacheKey = `venfts-evolution-v1.0.1`;
  try {
    const cacheDuration = 3600;
    // res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);    
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, false, cacheDuration);
    const { data: utcKeyBlockValues } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };

    if (isValid) {
      res.status(200).send(cachedData);
      return
    }

    const veNfts = [
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.mainnet]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.mainnet, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.optimism]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.optimism, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.bsc]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.bsc, ...lp })),
      // ...Object
      //   .values(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(({ veNftId }) => !!veNftId)
      //   .map((lp) => ({ chainId: NetworkIds.arbitrum, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.polygon]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.polygon, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.avalanche]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.avalanche, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.base]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.base, ...lp })),
    ];

    for (let token of veNfts) {
      const histoPrices = (await getHistoricalTokenData(token.coingeckoId))?.prices || [];
      if(!utcKeyBlockValues[token.chainId]) {
        continue;
      }
      const utcDateBlocks = Object.entries(utcKeyBlockValues[token.chainId]).map(([key, value]) => ({ date: key, block: value }));
      const archivedEvolution = cachedData?.veNfts?.evolution || [];
      const archivedDataBlocks = archivedEvolution.map(e => e.block);
      const blocks = utcDateBlocks.map(d => d.block).filter(b => !archivedDataBlocks.includes(b));
      const contract = new Contract(token.address, VE_NFT_ABI, getHistoricalProvider(token.chainId));
      const veNftBalances = await Promise.all(
        blocks.map(block => {
          return getMulticallOutput([
            { contract, functionName: token.isLockedVeNft ? 'locked' : 'balanceOfNFT', params: [token.veNftId] },
          ], Number(token.chainId), block)
        });
      );
      const histoPricesAsObj = histoPrices.reduce((acc, [ts, price]) => ({ ...acc, [timestampToUTC(ts)]: price }), {});      
      const newData = utcDateBlocks.map((d, i) => {
        const histoPrice = histoPricesAsObj[d.date] || getClosestPreviousHistoValue(histoPricesAsObj, d.date, 0);
        const amount = Array.isArray(veNftBalances[i][0]) ? veNftBalances[i][0][0] : veNftBalances[i][0];
        return {
          ...d,
          balance: getBnToNumber(amount),
          price: histoPrice,
        }
      });
      token.evolution = [...archivedEvolution, ...newData];
    }

    const results = {
      timestamp: Date.now(),
      veNfts,
    }
    await redisSetWithTimestamp(cacheKey, results);
    return res.status(200).send(results);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
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