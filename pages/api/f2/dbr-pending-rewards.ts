import { Contract } from 'ethers'
import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { F2_ESCROW_ABI } from '@app/config/abis';
import { getBnToNumber } from '@app/util/markets';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { F2_POSITIONS_CACHE_KEY, F2_UNIQUE_USERS_CACHE_KEY } from './firm-positions';
import { getProvider } from '@app/util/providers';
import { CHAIN_ID } from '@app/config/constants';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const cacheKey = `pending-dbr-rewards`;

    try {
        const cacheDuration = 300;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const provider = getProvider(CHAIN_ID);

        const [firmUsers, firmPositions] = await Promise.all([
            getCacheFromRedis(F2_UNIQUE_USERS_CACHE_KEY, false),
            getCacheFromRedis(F2_POSITIONS_CACHE_KEY, false),
        ]);

        if (!firmUsers || !firmPositions) {
            res.status(404).json({ success: false, msg: 'no users found' });
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

        const result = {
            timestamp: Date.now(),
            userData: invMarketData.escrows.map((escrow, i) => {
                const user = invMarketData.users[i];
                const position = firmPositions.positions.find(p => p.user.toLowerCase() === user.toLowerCase());
                return {
                    escrow,
                    user,
                    claimable: claimables[i],
                    deposits: position?.deposits,
                    debt: position?.debt,
                    liquidatableDebt: position?.liquidatableDebt,
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