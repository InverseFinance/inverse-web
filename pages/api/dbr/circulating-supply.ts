import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types'
import { getBnToNumber } from '@app/util/markets'
import { DBR_CIRC_SUPPLY_EVO_CACHE_KEY } from './circulating-supply-evolution';
import { fillMissingDailyDatesWithMostRecentData, timestampToUTC } from '@app/util/misc';
import { SDOLA_ADDRESS, SINV_ADDRESS, SINV_ADDRESS_V1 } from '@app/config/constants';
import { getPendingDbrBurn } from './pending-burn';
import { inverseViewer } from '@app/util/viewer';

const { DBR, TREASURY, DBR_AIRDROP, F2_MARKETS } = getNetworkConfigConstants();

const excluded = [
  TREASURY,
  DBR_AIRDROP,
  SINV_ADDRESS,
  SINV_ADDRESS_V1,
  SDOLA_ADDRESS,
];

export const dbrCircSupplyCacheKey = `dbr-circ-supply-v1.0.0`;

export default async function handler(req, res) {    

  try {
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    // const validCache = await getCacheFromRedis(dbrCircSupplyCacheKey, true, cacheDuration);
    const isSaveCircSupply = req.method === 'POST' || req.query.saveCircSupply === 'true';
    // if(validCache) {
    //   res.status(200).send(validCache);
    //   return
    // }

    const provider = getProvider(NetworkIds.mainnet);
    const contract = new Contract(DBR, DBR_ABI, provider);

    const [totalSupply, triDbrBalanceBn, triDbrBalance2Bn, _pendingDbrBurn, ...excludedBalances] = await Promise.all([
      contract.totalSupply(),
      contract.balanceOf('0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a'),
      contract.balanceOf('0x66da369fC5dBBa0774Da70546Bd20F2B242Cd34d'),
      getPendingDbrBurn(),
      ...excluded.map(excludedAd => contract.balanceOf(excludedAd)),
    ]);

    const totalDbrExcluded = excludedBalances.map(bn => getBnToNumber(bn))
      .reduce((prev, curr) => prev + curr, 0);

    const pendingDbrBurn = parseFloat(_pendingDbrBurn||0);
    const circulatingSupplyTheoretical = getBnToNumber(totalSupply) - totalDbrExcluded;
    const circulatingSupply = circulatingSupplyTheoretical - pendingDbrBurn;

    // await redisSetWithTimestamp(dbrCircSupplyCacheKey, circulatingSupply);

    // daily cron job case: add daily data to evolution data
    if (isSaveCircSupply) {
      const cachedCircEvoData = (await getCacheFromRedis(DBR_CIRC_SUPPLY_EVO_CACHE_KEY, false)) || { evolution: [] };
      const timestamp = Date.now();
      const utcDate = timestampToUTC(timestamp);
      const alreadyThere = cachedCircEvoData.evolution.find(evo => evo.utcDate === utcDate);      

      if(!alreadyThere) {
        const ifv = inverseViewer(provider);
        const marketListData = await ifv.firm.getMarketListData(F2_MARKETS.map(m => m.address));
        const totalDebt = marketListData.reduce((prev, curr) => prev + curr.totalDebt, 0);
        const inventory = totalDebt ? (circulatingSupply - getBnToNumber(triDbrBalanceBn.add(triDbrBalance2Bn))) / totalDebt * 365 : 0;
        cachedCircEvoData.evolution.push({
          utcDate,
          totalSupply: getBnToNumber(totalSupply),
          circSupply: circulatingSupply,
          circSupplyTheo: circulatingSupplyTheoretical,
          inventory,
        });
        // in case we missed a day, fill with most recent data
        const filledIn = fillMissingDailyDatesWithMostRecentData(cachedCircEvoData.evolution, 1);
        const results = {
          timestamp,
          lastUtcDate: utcDate,
          evolution: filledIn.filter(d => d.utcDate <= utcDate).map(evo => {
            return { utcDate: evo.utcDate, totalSupply: evo.totalSupply, circSupply: evo.circSupply, inventory: evo.inventory }
          }),
        }
        await redisSetWithTimestamp(DBR_CIRC_SUPPLY_EVO_CACHE_KEY, results);
      }      
    }

    res.status(200).send(circulatingSupply);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(dbrCircSupplyCacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch(e) {
      console.error(e);
    }
  }
}