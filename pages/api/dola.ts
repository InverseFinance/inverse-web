import { BigNumber, Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { ERC20_ABI, FED_ABI } from '@inverse/config/abis'
import { getNetworkConfig, getNetworkConfigConstants } from '@inverse/config/networks'
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@inverse/util/redis'
import { NetworkIds } from '@inverse/types';
import { namedAddress } from '@inverse/util'
import { JsonRpcProvider } from '@ethersproject/providers'

export default async function handler(req, res) {

  const { DOLA, FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const ftmConfig = getNetworkConfig(NetworkIds.ftm, false);
  const cacheKey = `dola-cache`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 600);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const dolaContract = new Contract(DOLA, ERC20_ABI, provider);

    let ftmTotalSupply = BigNumber.from('0');

    // public rpc for fantom, less reliable
    try {
      const ftmProvider = new JsonRpcProvider('https://rpc.ftm.tools/');
      const dolaFtmContract = new Contract(ftmConfig?.DOLA, ERC20_ABI, ftmProvider);
      ftmTotalSupply = await dolaFtmContract.totalSupply();
    } catch(e) {

    }
    
    const [
      totalSupply,
      ...fedSupplies
    ] = await Promise.all([
      dolaContract.totalSupply(),
      ...FEDS.map((fedAddress: string) => {
        const fedContract = new Contract(fedAddress, FED_ABI, provider);
        return fedContract.supply();
      })
    ])

    const resultData = {
      totalSupply: parseFloat(formatEther(totalSupply)),
      ftmTotalSupply: parseFloat(formatEther(ftmTotalSupply)),
      fedSupplies: FEDS.map((fedAd, i) => ({
        address: fedAd,
        name: namedAddress(fedAd),
        supply: parseFloat(formatEther(fedSupplies[i])),
      }))
    }

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
