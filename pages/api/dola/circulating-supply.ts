import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { NetworkIds } from '@app/types';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';

const { F2_MARKETS, DOLA, FEDS } = getNetworkConfigConstants();

const excluded = [
  // AN_DOLA
  '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
  ...FEDS.filter(fed => !!fed.incomeChainId && !!fed.incomeSrcAd).map(fed => {
    return [fed.incomeSrcAd, fed.incomeChainId];
  }),
  ...F2_MARKETS.map(m => m.address),
];

export default async function handler(req, res) {
  const cacheKey = `dola-circ-supply-v1.0.1`;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const mainnetContract = new Contract(DOLA, DOLA_ABI, provider);

    const [
      totalSupply,
      ...excludedBalances
    ] = await Promise.all([
      mainnetContract.totalSupply(),
      ...excluded.map(excludedData => {
        const contract = Array.isArray(excludedData) ?
          new Contract(getToken(CHAIN_TOKENS[excludedData[1]], 'DOLA').address!, DOLA_ABI, getProvider(excludedData[1]))
          :
          mainnetContract;
        const excludedAd = Array.isArray(excludedData) ? excludedData[0] : excludedData;
        return contract.balanceOf(excludedAd);
      }),
    ]);

    const totalDolaExcluded = excludedBalances
      .map(bn => getBnToNumber(bn))
      .reduce((prev, curr) => prev + curr, 0);

    const circulatingSupply = getBnToNumber(totalSupply) - totalDolaExcluded;

    await redisSetWithTimestamp(cacheKey, circulatingSupply);

    res.status(200).send(circulatingSupply);
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