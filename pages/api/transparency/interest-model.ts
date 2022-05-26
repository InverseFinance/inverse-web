import { Contract } from 'ethers'
import 'source-map-support'
import { COMPTROLLER_ABI, CTOKEN_ABI, INTEREST_MODEL_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { BLOCKS_PER_DAY, BLOCKS_PER_YEAR, ETH_MANTISSA } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';

export default async function handler(req, res) {

  const cacheKey = `interest-model-v1.0.4`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 900);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const {
      UNDERLYING,
      XINV_V1,
      XINV,
      COMPTROLLER,
    } = getNetworkConfigConstants(process.env.NEXT_PUBLIC_CHAIN_ID!);

    const provider = getProvider(process.env.NEXT_PUBLIC_CHAIN_ID!);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const allMarkets: string[] = [...await comptroller.getAllMarkets()];
    const addresses = allMarkets.filter(address => !!UNDERLYING[address]);

    const contracts = addresses
      .filter((address: string) => address !== XINV && address !== XINV_V1)
      .map((address: string) => new Contract(address, CTOKEN_ABI, provider));

    const models = await Promise.all([
      ...contracts.map(c => c.interestRateModel())
    ]);
    const uniqueModels = [...new Set(models)];

    const results = await Promise.all([
      ...uniqueModels.map(m => {
        const interestModelContract = new Contract(m, INTEREST_MODEL_ABI, provider);
        return Promise.all([
          interestModelContract.blocksPerYear(),
          interestModelContract.kink(),
          interestModelContract.multiplierPerBlock(),
          interestModelContract.jumpMultiplierPerBlock(),
          interestModelContract.baseRatePerBlock(),
        ])
      })
    ]);

    const resultData = results.map((r, i) => {
      return {
        model: uniqueModels[i],
        kink: r[1] / ETH_MANTISSA * 100,
        multiplierPerYear: r[2] / ETH_MANTISSA * BLOCKS_PER_YEAR * 100,
        jumpMultiplierPerYear: r[3] / ETH_MANTISSA * BLOCKS_PER_YEAR * 100,
        baseRatePerYear: r[4] / ETH_MANTISSA * BLOCKS_PER_YEAR * 100,
        blocksPerYear: BLOCKS_PER_YEAR,
        blocksPerDay: BLOCKS_PER_DAY,
        multiplierPerBlock: r[2] / ETH_MANTISSA,
        jumpMultiplierPerBlock: r[3] / ETH_MANTISSA,
        baseRatePerBlock: r[4] / ETH_MANTISSA,
      }
    }).reduce((prev, curr) => {
      return { ...prev, [curr.model]: curr };
    }, {});

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
      }
    } catch (e) {
      console.error(e);
    }
  }
}