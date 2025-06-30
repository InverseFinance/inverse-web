import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { DOLA_ABI } from '@app/config/abis';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { Contract } from 'ethers';
import { parseEther } from '@ethersproject/units';
import { getBnToNumber } from '@app/util/markets';

const { FEDS, DOLA } = getNetworkConfigConstants(NetworkIds.mainnet);

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

    const dolaContract = new Contract(DOLA, DOLA_ABI, provider);
    const [minterRights, supplies] = await getGroupedMulticallOutputs(
      [
        FEDS.map(fed => ({
          contract: dolaContract,
          functionName: 'minters',
          params: [fed.address],
        })),
        FEDS.map(fed => ({
          contract: new Contract(fed.address, [`function ${fed.supplyFuncName||'supply'}() view returns (uint)`], provider),
          functionName: fed.supplyFuncName || 'supply',
        })),
      ],
      Number(NetworkIds.mainnet),
    )

    const feds = FEDS.map((fedConfig, fedIndex) => {
      return {
        name: fedConfig.name,
        address: fedConfig.address,
        canMintDola: minterRights[fedIndex] || false,
        supply: getBnToNumber(supplies[fedIndex]),
      }
    })

    const mintEnabledFed = feds.filter(f => f.canMintDola);
    const mintEnabledButInactiveFed = feds.filter(f => f.canMintDola && f.supply <= 1);

    const resultData = {
      timestamp: Date.now(),
      mintEnabledFedAddresses: mintEnabledFed.map(f => f.address),
      mintEnabledFedNames: mintEnabledFed.map(f => f.name),
      mintEnabledButInactiveFedAddresses: mintEnabledButInactiveFed.map(f => f.address),
      mintEnabledButInactiveFedNames: mintEnabledButInactiveFed.map(f => f.name),
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
