import 'source-map-support'
import { getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { getBnToNumber, getHistoricalTokenData } from '@app/util/markets';
import { getMulticallOutput } from '@app/util/multicall';
import { Contract } from 'ethers';
import { VE_NFT_ABI } from '@app/config/abis';
import { getHistoricalProvider } from '@app/util/providers';
import { getOrClosest, timestampToUTC } from '@app/util/misc';

const startingBlocks = {
  [NetworkIds.optimism]: 105896834,
  [NetworkIds.base]: 3200584,
}

export default async function handler(req, res) {
  const { updateChainId, ignoreCache } = req.query;
  const cacheKey = `venfts-evolution-v1.0.4`;
  const cacheDuration = 3600;
  // res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);    
  const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, false, cacheDuration);
  try {
    const { data: utcKeyBlockValues } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };

    if (ignoreCache !== 'true' && isValid) {
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
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.arbitrum, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.polygon]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.polygon, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.avalanche]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.avalanche, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.base]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.base, ...lp })),
    ].filter(lp => !updateChainId || lp.chainId === updateChainId);

    for (let token of veNfts) {
      if (!utcKeyBlockValues[token.chainId]) {
        continue;
      }
      const utcDateBlocks = Object.entries(utcKeyBlockValues[token.chainId]).map(([key, value]) => ({ date: key, block: value }));
      const archivedEvolution = cachedData?.veNfts?.find(_t => _t.address === token.address)?.evolution || [];
      const archivedDataBlocks = archivedEvolution.map(e => e.block);
      const blocks = utcDateBlocks.map(d => d.block)
        .filter(b => !archivedDataBlocks.includes(b) && b >= startingBlocks[token.chainId]);
         
      if (!blocks.length) {
        continue;
      }
      const histoPrices = (await getHistoricalTokenData(token.coingeckoId))?.prices || [];
      if(!histoPrices.length) {
        continue;
      }
      const contract = new Contract(token.address, VE_NFT_ABI, getHistoricalProvider(token.chainId));
      const veNftBalances = await Promise.all(
        blocks.map(block => {
          return getMulticallOutput([
            { contract, functionName: token.isLockedVeNft ? 'locked' : 'balanceOfNFT', params: [token.veNftId] },
          ], Number(token.chainId), block)
        })
      );
      const histoPricesAsObj = histoPrices.reduce((acc, [ts, price]) => ({ ...acc, [timestampToUTC(ts)]: price }), {});
      const newData = blocks.map((block, i) => {
        const utcData = utcDateBlocks.find(utc => utc.block === block);
        const histoPrice = histoPricesAsObj[utcData.date] || getOrClosest(histoPricesAsObj, utcData.date, 100);        
        const amount = Array.isArray(veNftBalances[i][0]) ? veNftBalances[i][0][0] : veNftBalances[i][0];
        return {
          ...utcData,
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
      if (cachedData) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cachedData);
      } else {
        res.status(500).send({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ success: false });
    }
  }
}