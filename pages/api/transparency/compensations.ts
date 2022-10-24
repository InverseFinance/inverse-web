import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_PAYROLL_ABI, INV_ABI, VESTER_ABI, VESTER_FACTORY_ABI, XINV_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Vester } from '@app/types';
import { getBnToNumber } from '@app/util/markets'

export default async function handler(req, res) {

  const { INV, TREASURY, XINV, DOLA_PAYROLL, XINV_VESTOR_FACTORY } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `compensations-cache-v1.2.1`;

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

    const unclaimeds = await Promise.all(currentPayrolls.map(p => {      
      return payrollContract.balanceOf(p.recipient);
    }));

    unclaimeds.forEach((bn, i) => {
      currentPayrolls[i].unclaimed = getBnToNumber(unclaimeds[i]);
    })
    const currentLiabilities = currentPayrolls.reduce((prev, curr) => prev+curr.unclaimed, 0);

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
      if (!vestersIsCancelled[i]) {
        currentVesters.push({ address: v });
      }
    })
    const [xinvExRateBn, vesterRecipients, initialXinvVestedBn] = await Promise.all([
      new Contract(XINV, XINV_ABI, provider).exchangeRateStored(),
      Promise.all(currentVesters.map(v => (new Contract(v.address, VESTER_ABI, provider)).recipient())),
      Promise.all(currentVesters.map(v => (new Contract(v.address, VESTER_ABI, provider)).vestingXinvAmount())),
      // Promise.all(currentVesters.map(v => invContract.queryFilter(invContract.filters.Transfer(TREASURY, v.address)))),
    ]);

    // founder: initial amount was 8k, current vester is just part of it
    const founderRecipient = '0x16EC2AeA80863C1FB4e13440778D0c9967fC51cb';
    const founderInitialAmount = 8000;
    const founderNewVesterAmount = 3333.33;
    const xinvExRate = getBnToNumber(xinvExRateBn);

    currentVesters.forEach((v, i) => {
      const isFounder = vesterRecipients[i].toLowerCase() === founderRecipient.toLowerCase();
      const scaledAmount = Math.round(xinvExRate * getBnToNumber(initialXinvVestedBn[i]));
      currentVesters[i] = {
        ...v,
        recipient: vesterRecipients[i],
        amount: isFounder ? scaledAmount+(founderInitialAmount-founderNewVesterAmount) : scaledAmount ,
        // originalInvAmount: isFounder ?
        // founderInitialAmount : getBnToNumber(vesterInitialInv[i][0].args[2])
      }
    })

    const resultData = {
      currentLiabilities,
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
      } else {
        res.status(500).json({ error: true })
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: true })
    }
  }
}