import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { DOLA_ABI } from '@app/config/abis';
import { getGroupedMulticallOutputs } from '@app/util/multicall';

const { FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);

export const fedMinterRightsCacheKey = `fed-minter-rights-v1.0.0`;

export default async function handler(req, res) {
  // to keep for archive  
  const { cacheFirst } = req.query;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(fedMinterRightsCacheKey, cacheFirst !== 'true', cacheDuration);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }
    
    const provider = getProvider(NetworkIds.mainnet);

    const [minterRights] = await getGroupedMulticallOutputs(
      FEDS.map(fed => ({
        contract: new Contract(fed.address, DOLA_ABI, provider),
        functionName: 'minters',
        params: [fed.address],
        fallbackValue: true,
      })),
      Number(NetworkIds.mainnet),
    )

    const feds = FEDS.map((fedConfig, fedIndex) => {
      return {
        name: fedConfig.name,
        address: fedConfig.address,
        canMintDola: minterRights[fedIndex] || false,
      }
    })

    const mintEnabledFed = feds.filter(f => f.canMintDola);

    const resultData = {
      timestamp: Date.now(),
      mintEnabledFedAddresses: mintEnabledFed.map(f => f.address),
      mintEnabledFedNames: mintEnabledFed.map(f => f.name),
      feds: feds,
    }

    await redisSetWithTimestamp(fedMinterRightsCacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(fedMinterRightsCacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch (e) {
      console.error(e);
      return res.status(500);
    }
  }
}
