import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { getGroupedMulticallOutputs } from '@app/util/multicall';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `${CHAIN_ID}-dola-borrowable-v1.0.0`;

  try {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const contract = new Contract(process.env.NEXT_PUBLIC_DOLA!, DOLA_ABI, provider);

    const [marketBalances, marketPaused] = await getGroupedMulticallOutputs([
      F2_MARKETS.map(market => ({ contract, functionName: 'balanceOf', params: [market.address] })),
      F2_MARKETS.map(market => ({ contract: new Contract(market.address, F2_MARKET_ABI, provider), functionName: 'borrowPaused' })),
    ]);

    const totalBorrowable = marketBalances
      .filter((_, i) => !marketPaused[i])
      .map(bn => getBnToNumber(bn))
      .reduce((prev, curr) => prev + curr, 0);

    await redisSetWithTimestamp(cacheKey, totalBorrowable);

    res.status(200).send(totalBorrowable);
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