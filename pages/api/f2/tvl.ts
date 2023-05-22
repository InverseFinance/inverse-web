
import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getFirmMarketUsers } from './firm-positions';
import { getProvider } from '@app/util/providers';
import { CHAIN_ID } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';
import { Contract } from 'ethers';
import { getBnToNumber } from '@app/util/markets';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { F2_ESCROW_ABI } from '@app/config/abis';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';

const { F2_MARKETS } = getNetworkConfigConstants();

export const firmTvlCacheKey = 'f2-tvl-v1.0.3'

export default async function handler(req, res) {    
    try {
        const cache = await getCacheFromRedis(firmTvlCacheKey, true, 30);
        if (cache) {
            res.status(200).json(cache);
            return
        }

        const provider = getProvider(CHAIN_ID);
        const { firmMarketUsers, marketUsersAndEscrows } = await getFirmMarketUsers(provider);

        const marketsCache = await getCacheFromRedis(F2_MARKETS_CACHE_KEY, false);
        if (!marketsCache) {
            res.status(200).json({ firmTotalTvl: 0, firmTvls:[] });
            return
        }

        let tvl = 0;
        const marketTvls = {};

        const depositsBn = await Promise.all(
            firmMarketUsers.map((f, i) => {
                const marketAd = F2_MARKETS[f.marketIndex].address;
                const users = marketUsersAndEscrows[marketAd].users;
                const escrow = new Contract(marketUsersAndEscrows[marketAd].escrows[users.indexOf(f.user)], F2_ESCROW_ABI, provider);
                return escrow.balance();
            })
        );
        const deposits = depositsBn.map((bn, i) => getBnToNumber(bn, getToken(CHAIN_TOKENS[CHAIN_ID], F2_MARKETS[firmMarketUsers[i].marketIndex].collateral)?.decimals));

        firmMarketUsers.forEach((p, i) => {
            const market = marketsCache.markets[p.marketIndex];
            const worth = market.price * deposits[i];
            tvl += worth;
            if (!marketTvls[p.marketIndex]) {
                marketTvls[p.marketIndex] = 0;
            }
            marketTvls[p.marketIndex] += worth;
        });

        const resultData = {
            firmTotalTvl: tvl,
            firmTvls: Object.entries(marketTvls).map(([marketIndex, tvl]) => {
                const market = marketsCache.markets[marketIndex];
                return {
                    tvl,
                    market: { name: market.name, address: market.address, underlying: market.underlying }
                }
            }),
            timestamp: +(new Date()),
        }

        await redisSetWithTimestamp(firmTvlCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(firmTvlCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ success: false });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false });
        }
    }
}