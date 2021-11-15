import { HARVESTER_ABI, VAULT_ABI } from "@inverse/config/abis";
import {
  DAYS_PER_YEAR,
  SECONDS_PER_DAY,
} from "@inverse/config/constants";
import { BigNumber, Contract } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import "source-map-support";
import { getNetworkConfig, getNetworkConfigConstants } from '@inverse/config/networks';
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@inverse/util/redis';

export default async function handler(req, res) {
  const { chainId = '1' } = req.query;
  // defaults to mainnet data if unsupported network
  const networkConfig = getNetworkConfig(chainId, true)!;
  const cacheKey = `${networkConfig.chainId}-vaults-cache`;

  try {
    const {
      HARVESTER,
      VAULT_TOKENS,
    } = getNetworkConfigConstants(networkConfig);

    const validCache = await getCacheFromRedis(cacheKey, true, 1800);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const harvester = new Contract(HARVESTER, HARVESTER_ABI, provider);

    const rates = await Promise.all(
      VAULT_TOKENS.map((address: string) => harvester.ratePerToken(address))
    );

    const lastDistribution = await new Contract(
      VAULT_TOKENS[0],
      VAULT_ABI,
      provider
    ).lastDistribution();

    const resultData = {
      lastDistribution: lastDistribution.toNumber(),
      rates: rates.reduce((res, rate, i) => {
        res[VAULT_TOKENS[i]] =
          parseFloat(
            formatUnits(
              rate.mul(DAYS_PER_YEAR * SECONDS_PER_DAY),
              BigNumber.from(36).sub(i === 0 ? 6 : 18)
            )
          ) * 100;
        return res;
      }, {}),
    };

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch(e) {
      console.error(e);
    }
  }
};
