import "source-map-support";
import { redisSetWithTimestamp } from '@app/util/redis';
import { getHistoricalFrontierPositionsDetails } from "@app/util/positions-v2";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false });
    else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

    try {        
        const { positionDetails, meta } = await getHistoricalFrontierPositionsDetails({
            pageSize: 2000,
            pageOffset: 0,
            useShortlist: true,
        });

        positionDetails.sort((a, b) => b.usdShortfall - a.usdShortfall)
        
        await redisSetWithTimestamp('frontier-positions-v2', { lastUpdate: Date.now(), ...meta, nbPositions: positionDetails.length, positions: positionDetails });
        res.status(200).json({ success: true, positionsAdded: positionDetails.length });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, e: err });
    }
};
