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
import { getHistoricalProvider, getProvider } from '@app/util/providers';
import { getOrClosest, timestampToUTC } from '@app/util/misc';
import { ONE_DAY_SECS } from '@app/config/constants';
import { cgPricesCacheKey } from '../prices';

const startingBlocks = {
  [NetworkIds.optimism]: 105896834,
  [NetworkIds.base]: 3200584,
  [NetworkIds.bsc]: 24435328,
  [NetworkIds.arbitrum]: 69988101,
}

// TODO: refacto historical script part to another file
export default async function handler(req, res) {
  // const { updateChainId, ignoreCache } = req.query;
  const cacheKey = `venfts-evolution-v1.0.5`;
  const cacheDuration = 3600;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, false, cacheDuration);
  try {    
    // if not from cron job, return cached data
    if (req.method !== 'POST' || req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return res.status(200).json(cachedData);
    }

    // if (ignoreCache !== 'true' && isValid) {
    //   res.status(200).send(cachedData);
    //   return
    // }

    const now = Date.now();
    const utcDateNow = timestampToUTC(now);

    const veNfts = [
      // ...Object
      //   .values(CHAIN_TOKENS[NetworkIds.mainnet]).filter(({ veNftId }) => !!veNftId)
      //   .map((lp) => ({ chainId: NetworkIds.mainnet, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.optimism]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.optimism, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.base]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.base, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.bsc]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.bsc, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(({ veNftId }) => !!veNftId)
        .map((lp) => ({ chainId: NetworkIds.arbitrum, ...lp })),
      // ...Object
      //   .values(CHAIN_TOKENS[NetworkIds.polygon]).filter(({ veNftId }) => !!veNftId)
      //   .map((lp) => ({ chainId: NetworkIds.polygon, ...lp })),
      // ...Object
      //   .values(CHAIN_TOKENS[NetworkIds.avalanche]).filter(({ veNftId }) => !!veNftId)
      //   .map((lp) => ({ chainId: NetworkIds.avalanche, ...lp })),

    ];

    // const { data: utcKeyBlockValues } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };

    for (let token of veNfts) {
      const archivedEvolution = cachedData?.veNfts?.find(_t => _t.address === token.address)?.evolution || [];
      token.evolution = archivedEvolution;

      // if ((!!updateChainId && token.chainId !== updateChainId) || !updateChainId || !utcKeyBlockValues[token.chainId]) {        
      //   continue;
      // }

      // const utcDateBlocks = Object.entries(utcKeyBlockValues[token.chainId]).map(([key, value]) => ({ date: key, block: value }));
      // const archivedDataBlocks = archivedEvolution.map(e => e.block);
      // const blocks = utcDateBlocks.map(d => d.block)
      //   .filter(b => !archivedDataBlocks.includes(b) && (b >= startingBlocks[token.chainId] || !startingBlocks[token.chainId]));

      // if (!blocks.length) {
      //   continue;
      // }

      // const histoPrices = (await getHistoricalTokenData(token.coingeckoId))?.prices || [];
      // if (!histoPrices.length) {
      //   continue;
      // }

      // const contract = new Contract(token.address, VE_NFT_ABI, getHistoricalProvider(token.chainId));
      // const veNftBalances = await Promise.all(
      //   blocks.map(block => {
      //     return getMulticallOutput([
      //       { contract, functionName: 'locked', params: [token.veNftId] },
      //     ], Number(token.chainId), block)
      //   })
      // );

      // const histoPricesAsObj = histoPrices.reduce((acc, [ts, price]) => ({ ...acc, [timestampToUTC(ts)]: price }), {});
      // const newData = blocks.map((block, i) => {
      //   const utcData = utcDateBlocks.find(utc => utc.block === block);
      //   const histoPrice = histoPricesAsObj[utcData.date] || getOrClosest(histoPricesAsObj, utcData.date, 100);
      //   const amount = Array.isArray(veNftBalances[i][0]) ? veNftBalances[i][0][0] : veNftBalances[i][0];
      //   return {
      //     ...utcData,
      //     balance: getBnToNumber(amount, token.decimals),
      //     price: histoPrice,
      //   }
      // });
      // token.evolution = [...archivedEvolution, ...newData];
    }

    // get current values
    const [
      currentValues,
      currentBlocks,
      cgPrices,
    ] = await Promise.all([
      Promise.all(
        veNfts.map(veNft => {
          const contract = new Contract(veNft.address, VE_NFT_ABI, getProvider(veNft.chainId));
          return contract['locked'](veNft.veNftId);
        })
      ),
      Promise.all(
        veNfts.map(veNft => {
          const provider = getProvider(veNft.chainId);
          return provider.getBlockNumber();
        })
      ),
      getCacheFromRedis(cgPricesCacheKey, false),
    ]);

    veNfts.forEach((veNft, i) => {
      const amount = Array.isArray(currentValues[i][0]) ? currentValues[i][0][0] : currentValues[i][0];
      const price = cgPrices[veNft.coingeckoId]?.usd || 0;
      veNft.currentBalance = getBnToNumber(amount, veNft.decimals);
      veNft.currentUtcDate = utcDateNow;
      veNft.currentPrice = price;
      veNft.currentBlock = currentBlocks[i];
      if (price && !veNft.evolution.find(e => e.date === utcDateNow)) {
        veNft.evolution.push({ block: currentBlocks[i], date: utcDateNow, balance: veNft.currentBalance, price: veNft.currentPrice });
      }
    });

    const results = {
      timestamp: now,
      veNfts,
    };

    // avoid faulty rewrite
    if(JSON.stringify(results).length > JSON.stringify(cachedData).length) {
      await redisSetWithTimestamp(cacheKey, results);
    }
    
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