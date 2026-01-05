import { Contract } from 'ethers'
import 'source-map-support'
import { BALANCER_VAULT_ABI, DBR_ABI, DBR_DISTRIBUTOR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getHistoricValue, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { getChainlinkDolaUsdPrice, getDbrPriceOnCurve, getDolaUsdPriceOnCurve } from '@app/util/f2';
import { estimateBlocksTimestamps, throttledPromises, timestampToUTC } from '@app/util/misc';
import { Web3Provider } from '@ethersproject/providers';
import { DBR_CG_HISTO_PRICES } from '@app/fixtures/dbr-prices';

const { DBR, DBR_DISTRIBUTOR } = getNetworkConfigConstants();

// before we use coingecko data, after the triDBR crv pool directly
const POST_COINGECKO_ERA_BLOCK = 18274000;

export const getCombineCgAndCurveDbrPrices = async (provider: Web3Provider, pastData: undefined | { prices: any[], blocks:[] }) => {
  const block = await provider.getBlock('latest');
  const currentBlock = block.number;
  const currentTimestamp = block.timestamp * 1000;

  let startingBlock: number;
  if(pastData?.blocks) {
    startingBlock = Math.min(pastData.blocks[pastData.blocks.length - 1] + 1, currentBlock);
  } else {
    startingBlock = POST_COINGECKO_ERA_BLOCK;
  }

  const intIncrement = Math.floor(BLOCKS_PER_DAY/2);
  const nbIntervals = Math.floor((currentBlock - startingBlock) / intIncrement);
  // new blocks since last cache
  const newBlocks = [...Array(nbIntervals).keys()].map((i) => startingBlock + (i * intIncrement)).filter(bn => bn <= currentBlock);
  const crvPrices = await getDbrPricesOnCurve(provider, newBlocks);
  const timestamps = estimateBlocksTimestamps(newBlocks, currentTimestamp, currentBlock);
  
  return {
    blocks: (pastData?.blocks||[]).concat(newBlocks),
    // [timestamp, price][] format
    prices: (pastData?.prices||DBR_CG_HISTO_PRICES).concat(crvPrices.map(((crvPrice, i) => [timestamps[i], crvPrice] ))).filter(p => p[0] !== null && p[1] !== null),
  };
}

export const getDbrPricesOnCurve = async (SignerOrProvider: Web3Provider, blocks: number[]) => {
  const crvPool = new Contract(
      '0x66da369fC5dBBa0774Da70546Bd20F2B242Cd34d',
      ['function price_oracle(uint) public view returns(uint)'],
      SignerOrProvider,
  );
  return getHistoPrices(crvPool, blocks);
}

const getHistoPrices = async (contract: Contract, blocks: number[]) => {
  const results =
      await throttledPromises(
          (block: number) => {
              return getHistoricValue(contract, block, 'price_oracle', ['0']);
          },
          blocks,
          5,
          100,
          'allSettled',
      );
      
    const bns = results.map(t => t.status === 'fulfilled' ? t.value : null);

    const dolaUsdPrices =
      await throttledPromises(
          (block: number) => {
              return getDolaUsdPriceOnCurve(contract.provider, block);
          },
          blocks,
          5,
          100,
      );    

  const values = bns.map((d, i) => {
      return d === null ? null : getBnToNumber(contract.interface.decodeFunctionResult('price_oracle', d)[0]) * dolaUsdPrices[i].price;
  });
  return values;
}

export const DBR_EXTRA_CACHE_KEY = `dbr-cache-extra-v1.0.8`
export const DBR_CACHE_KEY = `dbr-cache-v1.0.8`

export default async function handler(req, res) {
  const { cacheFirst } = req.query;
  const withExtra = req.query.withExtra === 'true';
  const cacheKey = withExtra ? DBR_EXTRA_CACHE_KEY : DBR_CACHE_KEY;
  const triDbrKey = 'tridbr-histo-prices-v1.0.1';
  try {
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID, undefined, true);
    const dbr = new Contract(DBR, DBR_ABI, provider);
    const dbrDistributor = new Contract(DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI, provider);
    const balancerVault = new Contract('0xBA12222222228d8Ba445958a75a0704d566BF2C8', BALANCER_VAULT_ABI, provider);

    const { data: cachedHistoTokenData, isValid, timestamp: histoTokenDataTs } = withExtra ? await getCacheFromRedisAsObj(triDbrKey, true, 3600, false) : { data: undefined, isValid: false };
    const todayUtc = timestampToUTC(Date.now());
    const cachedUtc = histoTokenDataTs ? timestampToUTC(histoTokenDataTs) : '';
    const canUseCachedHisto = todayUtc === cachedUtc;

    const queries = [
      balancerVault.getPoolTokens('0x445494f823f3483ee62d854ebc9f58d5b9972a25000200000000000000000415'),
      getDbrPriceOnCurve(provider),
      getDolaUsdPriceOnCurve(provider),
    ].concat(withExtra ? [
      dbr.totalSupply(),
      dbr.totalDueTokensAccrued(),
      dbr.operator(),
      dbrDistributor.rewardRate(),
      dbrDistributor.minRewardRate(),
      dbrDistributor.maxRewardRate(),
      canUseCachedHisto ? new Promise((res) => res(cachedHistoTokenData)) : getCombineCgAndCurveDbrPrices(provider, cachedHistoTokenData),
    ] : []);

    const results = await Promise.all(queries);

    if (withExtra && !!results[9] && !canUseCachedHisto) {
      await redisSetWithTimestamp(triDbrKey, results[9]);
    }

    const [poolData, curvePriceData, chainlinkData] = results;
    const priceOnBalancer = poolData && poolData[1] ? getBnToNumber(poolData[1][0]) / getBnToNumber(poolData[1][1]) : 0.05;

    const { priceInDola: priceOnCurve } = curvePriceData;
    const { price: dolaChainlinkUsdPrice } = chainlinkData;
    
    const resultData = {
      timestamp: Date.now(),
      priceOnBalancer,
      priceDola: priceOnCurve,
      priceUsd: priceOnCurve * dolaChainlinkUsdPrice,
      totalSupply: withExtra ? getBnToNumber(results[3]) : undefined,
      totalDueTokensAccrued: withExtra ? getBnToNumber(results[4]) : undefined,
      operator: withExtra ? results[5] : undefined,
      rewardRate: withExtra ? getBnToNumber(results[6]) : undefined,
      minRewardRate: withExtra ? getBnToNumber(results[7]) : undefined,
      maxRewardRate: withExtra ? getBnToNumber(results[8]) : undefined,
      historicalData: withExtra ? results[9] : undefined,
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
      } else {
        res.status(500).json({ status: 'ko' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ status: 'ko' });
    }
  }
}