import "source-map-support";
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis';
import { getPositionsDetails } from '@app/util/positions';

const client = getRedisClient();

export default async function handler(req, res) {
    const { accounts = '', pageSize = 2000, pageOffset = 0 } = req.query;

    if (req.method !== 'POST') return res.status(405).json({ success: false });
    else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

    try {
        const isFirstBatch = pageOffset === '0';
        const _resultData = isFirstBatch ? { positions: [] } : ((await getCacheFromRedis('frontier-positions',  false, 1, true)) || { positions: [] });
        const _resultMeta = isFirstBatch ? undefined : JSON.parse((await client.get('frontier-positions-meta')) || '{}');

        const { positionDetails, meta } = await getPositionsDetails({
            isFirstBatch,
            pageSize,
            pageOffset,
            marketsData: _resultMeta,
            accounts,
        });

        const _positionDetails = _resultData.positions.concat(positionDetails);

        _positionDetails.sort((a, b) => b.usdShortfall - a.usdShortfall)

        if (isFirstBatch) {
            await client.set('frontier-positions-meta', JSON.stringify(meta));
        }
        await redisSetWithTimestamp('frontier-positions', { positions: _positionDetails }, true);

        res.status(200).json({ success: true, positionsAdded: positionDetails.length });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, e: err });
    }
};
