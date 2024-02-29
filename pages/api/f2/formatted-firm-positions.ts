import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { F2_POSITIONS_CACHE_KEY } from './firm-positions';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';

const { F2_MARKETS } = getNetworkConfigConstants();

// external use in spreadsheet
export default async function handler(req, res) {
    const cacheKey = `formatted-firm-positions-v1.0.0`;
    const cacheDuration = 300;

    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { isValid, data } = await getCacheFromRedisAsObj(cacheKey, true, 1);

    try {
        if (isValid && !!data) {
            return res.status(200).json(data);
        }

        const [firmPositions, firmMarkets] = await Promise.all([
            getCacheFromRedis(F2_POSITIONS_CACHE_KEY, false),
            getCacheFromRedis(F2_MARKETS_CACHE_KEY, false),
        ]);

        if (!firmPositions || !firmMarkets) {
            return res.status(200).json(data);
        }

        const formattedPositions = firmPositions.positions.map(mp => {
            const market = F2_MARKETS[mp.marketIndex];
            const apiMarket = firmMarkets.markets.find(fm => fm.address === market.address);
            return {
                account: mp.user,
                marketName: apiMarket.name,
                collateralSymbol: apiMarket.underlying.symbol,
                deposits: mp.deposits,
                depositsWorth: mp.deposits * apiMarket.price,
                debtInMarket: mp.debt,
                totalAccountDebt: mp.totalDebt,
                dbrBalance: mp.dbrBalance,
                collateral: apiMarket.collateral,
                market: apiMarket.address,
            }
        })

        const resultData = {
            timestamp: firmPositions.timestamp,
            formattedPositions,
        }

        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            if (data) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(data);
            } else {
                res.status(200).json({ status: 'ko' });
            }
        } catch (e) {
            console.error(e);
            res.status(200).json({ status: 'ko' });
        }
    }
}