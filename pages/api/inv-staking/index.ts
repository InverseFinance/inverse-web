import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { CHAIN_ID } from '@app/config/constants';

import { getMulticallOutput } from '@app/util/multicall';
import { getDbrPriceOnCurve } from '@app/util/f2';
import { formatInvStakingData, getDbrDistributorContract, getSInvContract, getSinvEscrowContract } from '@app/util/sINV';
import { F2_MARKETS_CACHE_KEY } from '../f2/fixed-markets';

export const invStakingCacheKey = `inv-staking-v1.0.1`;

export default async function handler(req, res) {
    const { cacheFirst, ignoreCache } = req.query;
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(invStakingCacheKey, cacheFirst !== 'true', cacheDuration);
        if(validCache && ignoreCache !== 'true') {
          res.status(200).json(validCache);
          return;
        }

        const provider = getProvider(CHAIN_ID);  
        const distroContract = getDbrDistributorContract(provider);
        const sInvContract = getSInvContract(provider);
        const sInvEscrowContract = getSinvEscrowContract(provider);
        
        const firmMarkets = await getCacheFromRedis(F2_MARKETS_CACHE_KEY, false) || { markets: [] };
        const firmInv = firmMarkets.markets.find(m => m.name === 'INV');

        const invStakingData = await getMulticallOutput([
            { contract: sInvEscrowContract, functionName: 'claimable' },
            { contract: sInvEscrowContract, functionName: 'balance' },
            { contract: distroContract, functionName: 'totalSupply' },
            { contract: distroContract, functionName: 'rewardRate' },
            { contract: distroContract, functionName: 'maxRewardRate' },            
            { contract: sInvContract, functionName: 'totalSupply' },
            { contract: sInvContract, functionName: 'periodRevenue' },
            { contract: sInvContract, functionName: 'lastPeriodRevenue' },       
            { contract: sInvContract, functionName: 'totalAssets' },
            { contract: sInvContract, functionName: 'lastBuyPeriod' },
        ]);
       
        const { priceInDola: dbrDolaPrice } = await getDbrPriceOnCurve(provider);        

        const resultData = {
            timestamp: Date.now(),
            invMarketPrice: firmInv.price,
            ...formatInvStakingData(dbrDolaPrice, invStakingData, firmInv.supplyApy, firmInv.dbrInvExRate, firmInv.invStakedViaDistributor),
        }

        await redisSetWithTimestamp(invStakingCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(invStakingCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ error: true });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: true });
        }
    }
}