import "source-map-support";
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis';
import { UNDERLYING } from "@app/variables/tokens";

export default async function handler(req, res) {
    // defaults to mainnet data if unsupported network
    const cacheKey = `repayments-v1.0.0`;
    const frontierShortfallsKey = `1-positions-v1.1.0`;

    try {
        const frontierShortfalls = await getCacheFromRedis(frontierShortfallsKey, false, 99999);

        const badDebts = {};

        frontierShortfalls.positions
            .filter(({ usdShortfall, usdBorrowed }) => usdShortfall > 0 && usdBorrowed > 0)
            .forEach(position => {
                // console.log(position.borrowed)
                position.borrowed.forEach(({ marketIndex, balance }) => {
                    const marketAddress = frontierShortfalls.markets[marketIndex];
                    const underlying = UNDERLYING[marketAddress];
                    if (!badDebts[underlying.symbol]) {
                        badDebts[underlying.symbol] = {
                            ...underlying,
                            badDebtBalance: 0,
                            frontierBadDebtBalance: 0,
                        };
                    }
                    badDebts[underlying.symbol].badDebtBalance += balance;
                    badDebts[underlying.symbol].frontierBadDebtBalance += balance;
                });
            });

        res.status(200).json(badDebts);
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
            res.status(500).json({ error: true });
        }
    }
};
