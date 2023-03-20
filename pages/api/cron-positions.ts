import "source-map-support";
import { getRedisClient } from '@app/util/redis';
import { getPositionsDetails } from '@app/util/positions';

const client = getRedisClient();

export default async function handler(req, res) {
    const { accounts = '', pageSize = 2000, pageOffset = 0 } = req.query;

    if (req.method !== 'POST') res.status(405).json({ success: false });
    else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

    try {
        const isFirstBatch = pageOffset === '0';
        const _resultData = isFirstBatch ? { positions: [] } : JSON.parse(await client.get('positions') || '{ "positions": [] }');
        const _resultMeta = isFirstBatch ? undefined : JSON.parse(await client.get('positions-meta') || '{}');

        const { positionDetails, meta } = await getPositionsDetails({
            isFirstBatch,
            pageSize,
            pageOffset,
            marketsData: _resultMeta,
            accounts,
        });

        console.log('getPositionDetails done');

        const _positionDetails = _resultData.positions.concat(positionDetails);

        _positionDetails.sort((a, b) => b.usdShortfall - a.usdShortfall)

        if (isFirstBatch) {
            await client.set('positions-meta', JSON.stringify(meta));
        }
        await client.set('positions', JSON.stringify({ positions: _positionDetails }));

        res.status(200).json({ success: true, positionsAdded: positionDetails.length });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, e: err });
    }
};
