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
import { createNodeRedisClient } from 'handy-redis';

const client = createNodeRedisClient({
  url: process.env.REDIS_URL
});

export default async function handler(req, res) {
  try {
    const { chainId = '1' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(chainId, true)!;

    const {
      HARVESTER,
      VAULT_TOKENS,
    } = getNetworkConfigConstants(networkConfig);

    const cacheKey = `${networkConfig.chainId}-vaults-cache`;

    const cache = await client.get(cacheKey);

    if(cache) {
      const now = Date.now();
      const cacheObj = JSON.parse(cache);
      // 30 min cache
      if((now - cacheObj?.timestamp) / 1000 < 1800) {
        res.status(200).json(cacheObj.data);
        return
      }
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

    await client.set(cacheKey, JSON.stringify({ timestamp: Date.now(), data: resultData }));

    res.status(200).json(resultData);
  } catch (err) {
    console.error(err);
  }
};
