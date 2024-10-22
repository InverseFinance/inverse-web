import { Contract } from 'ethers'
import 'source-map-support'
import { INV_ABI, VESTER_FACTORY_ABI, XINV_ABI } from '@app/config/abis'
import { getNetworkConfig } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'

const {
  TREASURY,
  XINV_VESTOR_FACTORY,
  POLICY_COMMITTEE,
} = getNetworkConfigConstants();

const excluded = [
  TREASURY,
  POLICY_COMMITTEE,
  // Stacking ETH INV LP
  '0x5c1245F9dB3f8f7Fe1208cB82325eA88fC11Fe89',
];

// increase number when a new proposal adds new vesters, can be more but not less than the nb of vesters deployed
// contract factory does not have data of the numbers of vesters
const vestersToCheck = [...Array(26).keys()];

export default async function handler(req, res) {
  const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
  const cacheKey = `${networkConfig.chainId}-inv-circ-supply-v1.0.0`;

  try {
    const cacheDuration = 120;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const contract = new Contract(process.env.NEXT_PUBLIC_REWARD_TOKEN!, INV_ABI, provider);
    const xinvContract = new Contract(process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN!, XINV_ABI, provider);

    const exchangeRate = getBnToNumber(await xinvContract.exchangeRateStored());

    const [totalSupply, ...excludedBalances] = await Promise.all([
      contract.totalSupply(),
      ...excluded.map(excludedAd => contract.balanceOf(excludedAd)),
    ]);

    const vesterFactory = new Contract(XINV_VESTOR_FACTORY, VESTER_FACTORY_ABI, provider);
    const vestersResults = await Promise.allSettled([
      ...vestersToCheck.map((v, i) => vesterFactory.vesters(i))
    ])
  
    const vesters = vestersResults ? vestersResults.filter(r => r.status === 'fulfilled').map(r => r.value) : [];

    const xinvExcludedBalances = await Promise.all([
      ...vesters.map(excludedAd => xinvContract.balanceOf(excludedAd)),
    ]);

    const totalInvExcluded = xinvExcludedBalances
      .map(bn => getBnToNumber(bn) * exchangeRate)
      .concat(
        excludedBalances.map(bn => getBnToNumber(bn))
      )
      .reduce((prev, curr) => prev + curr, 0);

    const circulatingSupply = getBnToNumber(totalSupply) - totalInvExcluded;

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