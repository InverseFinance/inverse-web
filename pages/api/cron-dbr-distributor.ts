import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { getProvider } from '@app/util/providers';
import { NetworkIds } from '@app/types';
import { getNetworkConfigConstants } from '@app/util/networks';
import { DBR_DISTRIBUTOR_ABI } from '@app/config/abis';
import { Contract } from 'ethers';
import { getBnToNumber } from '@app/util/markets';
import { ONE_DAY_SECS } from '@app/config/constants';

const { DBR_DISTRIBUTOR } = getNetworkConfigConstants();
export const dbrRewardRatesCacheKey = `dbr-reward-rates-history-v1.0.1`;
export const initialDbrRewardRates = {
  timestamp: 1684713600000,
  rates: [
    {
      timestamp: 1684454400000,// 3 days before streaming
      yearlyRewardRate: 0,
      rewardRate: 0,
    },
    {
      timestamp: 1684713600000,
      yearlyRewardRate: 3999999.9999999893,
      rewardRate: 0.126839167935058,
    },
    {
      timestamp: 1684954800000,
      yearlyRewardRate: 5000000.000000002,
      rewardRate: 0.158548959918823,
    },
  ]
};

export default async function handler(req, res) {
  try {
    const history = await getCacheFromRedis(dbrRewardRatesCacheKey, false);
    if(!history) {
      res.status(404).json({
        success: false,
      });
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const dbrDistributor = new Contract(DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI, provider);
    const currentRewardRate = getBnToNumber(await dbrDistributor.rewardRate());
    const now = +(new Date());
    const lastSavedRate = history.rates[history.rates.length - 1].rewardRate;
    const hasChanged = lastSavedRate !== currentRewardRate;

    if (hasChanged) {
      history.rates.push({
        timestamp: now,
        rewardRate: currentRewardRate,
        yearlyRewardRate: currentRewardRate * 365 * ONE_DAY_SECS,
      })
    }

    await redisSetWithTimestamp(dbrRewardRatesCacheKey, {
      timestamp: now,
      rates: history.rates,
    });

    res.status(200).json({
      success: true,
      hasChanged,
      history,
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}