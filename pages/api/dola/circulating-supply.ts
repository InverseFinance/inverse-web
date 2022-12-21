import { Contract } from 'ethers'
import 'source-map-support'
import { CTOKEN_ABI, DOLA_ABI } from '@app/config/abis'
import { getNetworkConfig } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'

const excluded = [
  // TREASURY,
  // OP_BOND_MANAGER,
  // AN_DOLA
  '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
];

const { ANCHOR_DOLA } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
  const cacheKey = `${networkConfig.chainId}-dola-circ-supply-v1.0.0`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 30);

    if (validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const contract = new Contract(process.env.NEXT_PUBLIC_DOLA!, DOLA_ABI, provider);
    const anDola = new Contract(ANCHOR_DOLA, CTOKEN_ABI, provider);

    const [totalSupply, anDolaReserves, ...excludedBalances] = await Promise.all([
      contract.totalSupply(),
      anDola.totalReserves(),
      ...excluded.map(excludedAd => contract.balanceOf(excludedAd)),
    ]);

    const totalInvExcluded = excludedBalances
      .map(bn => getBnToNumber(bn))
      .reduce((prev, curr) => prev + curr, 0);

    const circulatingSupply = getBnToNumber(totalSupply) - getBnToNumber(anDolaReserves) - totalInvExcluded;

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