import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DOLA_PAYROLL_ABI, F2_ESCROW_ABI, F2_MARKET_ABI, INV_ABI, VESTER_ABI, VESTER_FACTORY_ABI, XINV_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Vester } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { BURN_ADDRESS } from '@app/config/constants';

export default async function handler(req, res) {

  const { INV, F2_MARKETS, XINV, DOLA_PAYROLL, XINV_VESTOR_FACTORY } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `compensations-cache-v1.2.2`;
  const { cacheFirst } = req.query;
  try {
    const cacheDuration = 6000;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const invContract = new Contract(INV, INV_ABI, provider);
    const xinvContract = new Contract(XINV, XINV_ABI, provider);
    const invFirmContract = new Contract(F2_MARKETS.find(m => m.isInv).address, F2_MARKET_ABI, provider);

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
    const currentLiabilities = currentPayrolls.reduce((prev, curr) => prev + curr.unclaimed, 0);

    // vesters
    const vestersToCheck = [...Array(currentPayrolls.length * 2 + 30).keys()];

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
      xinvContract.exchangeRateStored(),
      Promise.all(currentVesters.map(v => (new Contract(v.address, VESTER_ABI, provider)).recipient())),
      Promise.all(currentVesters.map(v => (new Contract(v.address, VESTER_ABI, provider)).vestingXinvAmount())),
      // Promise.all(currentVesters.map(v => invContract.queryFilter(invContract.filters.Transfer(TREASURY, v.address)))),
    ]);

    // founder: initial amount was 8k, current vester is just part of it
    const founderRecipient = '0x16EC2AeA80863C1FB4e13440778D0c9967fC51cb';
    const founderInitialAmount = 8000;
    const founderNewVesterAmount = 3333.33;
    const xinvExRate = getBnToNumber(xinvExRateBn);

    const teamAddresses = [...new Set(vesterRecipients.concat(currentPayrolls.map(p => p.recipient)))];

    const invBalances = await Promise.all(
      teamAddresses.map(v => {
        return invContract.balanceOf(v);
      })
    );
    const xinvBalances = await Promise.all(
      teamAddresses.map(v => {
        return xinvContract.balanceOf(v);
      })
    );
    const xinvVesterBalances = await Promise.all(
      currentVesters.map(v => {
        return xinvContract.balanceOf(v.address);
      })
    );
    const firmEscrows = await Promise.all(
      teamAddresses.map(v => {
        return invFirmContract.escrows(v);
      })
    );
    const firmEscrowsBalances = await Promise.all(
      firmEscrows.map((v, i) => {
        return v !== BURN_ADDRESS ? new Contract(v, F2_ESCROW_ABI, provider).balance() : Promise.resolve(BigNumber.from('0'));
      })
    );

    currentVesters.forEach((v, i) => {
      const isFounder = vesterRecipients[i].toLowerCase() === founderRecipient.toLowerCase();
      const scaledAmount = Math.round(xinvExRate * getBnToNumber(initialXinvVestedBn[i]));
      currentVesters[i] = {
        ...v,
        recipient: vesterRecipients[i],
        amount: isFounder ? scaledAmount + (founderInitialAmount - founderNewVesterAmount) : scaledAmount,
        // originalInvAmount: isFounder ?
        // founderInitialAmount : getBnToNumber(vesterInitialInv[i][0].args[2])
      }
    });

    const currentInvBalances = teamAddresses.map((v, i) => {
      const invBalance = getBnToNumber(invBalances[i]);
      const stakedBalance = getBnToNumber(xinvBalances[i]) * xinvExRate;
      const vestersStakedBalance = xinvVesterBalances.filter((vb, vbi) => currentVesters[vbi].recipient.toLowerCase() === v.toLowerCase())
        .reduce((prev, curr, idx) => prev + getBnToNumber(curr), 0) * xinvExRate;
      const firmBalance = getBnToNumber(firmEscrowsBalances[i]);
      return {
        address: v,
        invBalance,
        stakedBalance,
        vestersStakedBalance,
        firmBalance,
        totalInvBalance: invBalance + firmBalance + stakedBalance + vestersStakedBalance,
      }
    });

    const resultData = {
      currentLiabilities,
      currentPayrolls,
      currentVesters,
      currentInvBalances,
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