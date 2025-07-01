import { Contract } from 'ethers'
import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { getMulticallOutput } from '@app/util/multicall';

export default async function handler(req, res) {
  const cacheKey = `misc-csv-feeds-v1.0.0`;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=misc-feeds.csv");

    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if(validCache) {
      res.status(200).send(validCache.csvData);
      return
    }

    const provider = getProvider("1");

    const usdeFeedContract = new Contract('0x6277cB27232F35C75D3d908b26F3670e7d167400', ["function latestAnswer() external view returns (int256)"], provider);
    const usdsFeedContract = new Contract('0x070287A072cf7Ead994F5b91d75FBdf92A5eAFB7', ["function latestAnswer() external view returns (int256)"], provider);
    const crvusdFeedContract = new Contract('0x4DEcE678ceceb27446b35C672dC7d61F30bAD69E', ["function price_oracle() external view returns (uint256)"], provider);
    const usdcFeedContract = new Contract('0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', ["function latestAnswer() external view returns (int256)"], provider);
    const usrFeedContract = new Contract('0x182Af82E3619D2182b3669BbFA8C72bC57614aDf', ["function latestAnswer() external view returns (int256)"], provider);
    const deusdFeedContract = new Contract('0x15f7744C393CD07bEac9322cE531bd0cB363536b', ["function latestAnswer() external view returns (int256)"], provider);

    const decimals = [18, 18, 18, 8, 18, 18];

    const pricesBn = await getMulticallOutput([
      {
        contract: usdeFeedContract,
        functionName: 'latestAnswer',
        params: [],
      },
      {
        contract: usdsFeedContract,
        functionName: 'latestAnswer',
        params: [],
      },
      {
        contract: crvusdFeedContract,
        functionName: 'price_oracle',
        params: [],
      },
      {
        contract: usdcFeedContract,
        functionName: 'latestAnswer',
        params: [],
      },
      {
        contract: usrFeedContract,
        functionName: 'latestAnswer',
        params: [],
      },
      {
        contract: deusdFeedContract,
        functionName: 'latestAnswer',
        params: [],
      },
    ], 1);

    const prices = pricesBn.map((price, index) => getBnToNumber(price, decimals[index]));

    let csvData = `Timestamp,USDe,USDS,crvUsd,USR,deUSD\n`;
    csvData += `${new Date().toISOString()},${prices[0]},${prices[1]},${prices[2]*prices[3]},${prices[4]},${prices[5]}\n`;

    await redisSetWithTimestamp(cacheKey, { csvData });

    res.status(200).send(csvData);
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