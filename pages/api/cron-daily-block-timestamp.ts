import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { timestampToUTC } from '@app/util/misc';
import { NetworkIds } from '@app/types';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { DOLA_BRIDGED_CHAINS } from '@app/config/constants';

export const DAILY_UTC_CACHE_KEY = `utc-dates-blocks`;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false });
    else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

    try {
        const cacheDuration = 3600;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        // cache is now updated via daily cron job
        const { data: utcKeyBlockValues, isValid } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, true, cacheDuration) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };

        if (utcKeyBlockValues && isValid) {
            res.status(200).send(utcKeyBlockValues);
            return
        }

        const utcDate = timestampToUTC(Date.now());

        for (let chainId of [NetworkIds.mainnet, ...DOLA_BRIDGED_CHAINS]) {
            try {
                const provider = getProvider(chainId);
                const currentBlock = await provider.getBlockNumber();

                if (!utcKeyBlockValues[chainId]) utcKeyBlockValues[chainId] = {};
                utcKeyBlockValues[chainId][utcDate] = currentBlock;
            } catch(err) {
                console.log('chainId===', chainId);
                console.error(err);
                console.log('chainId===', chainId);
            }
        };

        await redisSetWithTimestamp(DAILY_UTC_CACHE_KEY, utcKeyBlockValues);

        return res.status(200).send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, err });
    }
}