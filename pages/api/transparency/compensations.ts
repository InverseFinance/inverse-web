import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_PAYROLL_ABI, INV_ABI, VESTER_ABI, VESTER_FACTORY_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Vester } from '@app/types';
import { getBnToNumber } from '@app/util/markets'

export default async function handler(req, res) {

  const { INV, TREASURY, DOLA_PAYROLL, XINV_VESTOR_FACTORY } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `compensations-cache-v1.2.0`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 300);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const invContract = new Contract(INV, INV_ABI, provider);

    // payrolls
    const payrollContract = new Contract(DOLA_PAYROLL, DOLA_PAYROLL_ABI, provider);
    const [newPayrolls, removedPayrolls] = await Promise.all([
      payrollContract.queryFilter(payrollContract.filters.NewRecipient()),
      payrollContract.queryFilter(payrollContract.filters.RecipientRemoved()),
    ]);

    const payrollEvents = newPayrolls.concat(removedPayrolls)
      .sort((a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex);

    const currentPayrolls = Object.values(payrollEvents.reduce((prev, curr) => {
      return {
        ...prev,
        [curr.args[0]]: curr.event === 'NewRecipient' ?
          { recipient: curr.args[0], amount: getBnToNumber(curr.args[1]) } : undefined
      }
    }, {})).filter(v => !!v);

    // vesters
    const vestersToCheck = [...Array(currentPayrolls.length * 2 + 20).keys()];

    const vesterFactory = new Contract(XINV_VESTOR_FACTORY, VESTER_FACTORY_ABI, provider);
    const vestersResults = await Promise.allSettled([
      ...vestersToCheck.map((v, i) => vesterFactory.vesters(i))
    ]);

    const vesters = vestersResults ? vestersResults.filter(r => r.status === 'fulfilled').map(r => r.value) : [];
    const vestersIsCancelled = await Promise.all([
      ...vesters.map(v => (new Contract(v, VESTER_ABI, provider)).isCancelled())
    ]);
    const currentVesters: Partial<Vester>[] = [];
    vesters.forEach((v, i) => {
      if(!vestersIsCancelled[i]){
        currentVesters.push({ address: v });
      }
    })
    const [vesterRecipients, vesterInitialInv] = await Promise.all([
      Promise.all(currentVesters.map(v => (new Contract(v.address, VESTER_ABI, provider)).recipient())),
      Promise.all(currentVesters.map(v => invContract.queryFilter(invContract.filters.Transfer(TREASURY, v.address)))),
    ]);
    currentVesters.forEach((v, i) => {
      currentVesters[i] = { ...v, recipient: vesterRecipients[i], amount: getBnToNumber(vesterInitialInv[i][0].args[2]) }
    })

    const resultData = {
      currentPayrolls,
      currentVesters,
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