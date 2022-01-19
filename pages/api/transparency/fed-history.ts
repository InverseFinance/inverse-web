import { BigNumber, Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { CTOKEN_ABI, ERC20_ABI, FED_ABI, MULTISIG_ABI, XCHAIN_FED_ABI } from '@inverse/config/abis'
import { getNetworkConfig, getNetworkConfigConstants } from '@inverse/config/networks'
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@inverse/util/redis'
import { NetworkIds, xChainFed } from '@inverse/types';
import { namedAddress } from '@inverse/util'
import { getBnToNumber } from '@inverse/util/markets'
import { Provider } from '@ethersproject/providers';

const getEvents = (fedAd: string, abi: string[], chainId: NetworkIds) => {
  const provider = getProvider(chainId);
  const contract = new Contract(fedAd, abi, provider);
  return Promise.all([
    contract.queryFilter(contract.filters.Contraction()),
    contract.queryFilter(contract.filters.Expansion()),
  ])
}

export default async function handler(req, res) {

  const { DOLA, FEDS, XCHAIN_FEDS, TREASURY, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const ftmConfig = getNetworkConfig(NetworkIds.ftm, false);
  const cacheKey = `fed-history-cache-v1.0.0`;

  try {

    // const validCache = await getCacheFromRedis(cacheKey, true, 300);
    // if (validCache) {
    //   res.status(200).json(validCache);
    //   return
    // }

    const provider = getProvider(NetworkIds.mainnet);
    const dolaContract = new Contract(DOLA, ERC20_ABI, provider);

    // public rpc for fantom, less reliable
    try {
      // const ftmProvider = getProvider(NetworkIds.ftm);
      // const dolaFtmContract = new Contract(ftmConfig?.DOLA, ERC20_ABI, ftmProvider);
      // invFtmTotalSupply = await invFtmContract.totalSupply();
    } catch (e) {

    }

    // fetch chain data
    const re = await Promise.all([
      ...FEDS.map(fedAd => getEvents(fedAd, FED_ABI, NetworkIds.mainnet))
        .concat(
          ...XCHAIN_FEDS.map(fedAd => getEvents(fedAd.address, XCHAIN_FED_ABI, fedAd.chainId))
        )
    ]);

    console.log(re);

    const resultData = {
      re,
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
