import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { timestampToUTC } from '@app/util/misc';
import { NetworkIds } from '@app/types';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';

const {
    FEDS,
} = getNetworkConfigConstants();

const FARMERS = FEDS.filter(fed => !!fed.incomeChainId && !!fed.incomeSrcAd)
    .map(fed => {
        return [[fed.incomeSrcAd, fed.incomeChainId]].concat(fed.oldIncomeSrcAds ? fed.oldIncomeSrcAds.map(ad => [ad, fed.incomeChainId]) : []);
    })
    .flat()
    .map(fedData => {
        return [fedData[0], fedData[1]];
    });

const FARMERS_CHAIN_IDS = [...new Set(FARMERS.map(f => f[1]))];

export const DAILY_UTC_CACHE_KEY = `utc-dates-blocks`;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false });
    else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

    try {
        const cacheDuration = 3600;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        // cache is now updated via daily cron job
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false, cacheDuration) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };

        if (cachedData && isValid) {
            res.status(200).send(cachedData);
            return
        }

        // per chain, map an utc date with a blockNumber
        const utcKeyBlockValues = {};
        const utcDate = timestampToUTC(Date.now());

        for (let chainId of [NetworkIds.mainnet, ...FARMERS_CHAIN_IDS]) {
            const provider = getProvider(chainId);
            const currentBlock = await provider.getBlockNumber();

            if (!utcKeyBlockValues[chainId]) utcKeyBlockValues[chainId] = {};
            utcKeyBlockValues[chainId][utcDate] = currentBlock;
        };

        await redisSetWithTimestamp(DAILY_UTC_CACHE_KEY, utcKeyBlockValues);

        return res.status(200).send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, err });
    }
}