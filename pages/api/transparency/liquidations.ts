import 'source-map-support'
import { getNetworkConfig } from '@app/util/networks'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getFrontierLiquidations } from '@app/util/the-graph'

export default async function handler(req, res) {
  const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
  const cacheKey = `${networkConfig.chainId}-liquidations-v1.0.0`;

  try {
    const { borrower } = req.body;
    const validCache = await getCacheFromRedis(cacheKey, true, 10);

    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const liquidations = getFrontierLiquidations({
        borrower: borrower||''
    });

    if(!borrower) {
        await redisSetWithTimestamp(cacheKey, liquidations.data);
    }

    res.status(200).send(liquidations.data);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch(e) {
      console.error(e);
    }
  }
}