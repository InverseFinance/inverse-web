import { Contract } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { DBR_DISTRIBUTOR_ABI, F2_ESCROW_ABI } from '@app/config/abis';
import { getBnToNumber } from '@app/util/markets';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { F2_POSITIONS_CACHE_KEY, F2_UNIQUE_USERS_CACHE_KEY } from './firm-positions';
import { getProvider } from '@app/util/providers';
import { CHAIN_ID } from '@app/config/constants';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';

const { F2_MARKETS, DBR_DISTRIBUTOR } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const cacheKey = `pending-dbr-rewards-v1.0.0`;

    try {
        const cacheDuration = 300;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const provider = getProvider(CHAIN_ID);

        const [firmUsers, firmPositions, firmMarkets] = await Promise.all([
            getCacheFromRedis(F2_UNIQUE_USERS_CACHE_KEY, false),
            getCacheFromRedis(F2_POSITIONS_CACHE_KEY, false),
            getCacheFromRedis(F2_MARKETS_CACHE_KEY, false),
        ]);

        if (!firmUsers || !firmPositions || !firmMarkets) {
            res.status(200).json(validCache);
            return
        }

        const invMarketIndex = F2_MARKETS.findIndex(m => m.isInv);
        const invMarket = F2_MARKETS[invMarketIndex];

        const invMarketData = firmUsers.marketUsersAndEscrows[invMarket.address];

        const claimables = (await Promise.all(
            invMarketData.escrows
                .map((escrow) => {
                    return (new Contract(escrow, F2_ESCROW_ABI, provider)).claimable();
                })
        )).map(v => getBnToNumber(v));

        const lastUpdate = (await (new Contract(DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI, provider)).lastUpdate()) * 1000;

        const result = {
            timestamp: lastUpdate,
            invMarket: firmMarkets?.markets.find(m => m.address.toLowerCase() === invMarket.address.toLowerCase()),
            userData: invMarketData.escrows.map((escrow, i) => {
                const user = invMarketData.users[i];
                const position = firmPositions.positions.find(p => p.marketIndex === invMarketIndex && p.user.toLowerCase() === user.toLowerCase());
                return {
                    escrow,
                    user,
                    claimable: claimables[i],
                    deposits: position?.deposits||0,
                    debt: position?.debt||0,
                    liquidatableDebt: position?.liquidatableDebt||0,
                }
            }).filter(u => u.claimable > 0 || u.deposits > 0),
        }

        await redisSetWithTimestamp(cacheKey, result);

        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(200).json({ success: false })
    }
}