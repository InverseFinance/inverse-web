import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { isAddress } from "ethers/lib/utils";

const cacheKey = 'collateral-requests-v1.0.0';

export default async function handler(req, res) {
    const {
        method,
    } = req

    const { value, account, symbol, description, wouldUse } = req.body;

    switch (method) {
        case 'GET':
            const data = await getCacheFromRedis(cacheKey, false) || { requests: [] };
            res.json(data);
            break
        case 'POST':
            if (!account || (!['true', 'false'].includes(wouldUse.toString())) || !isAddress(account) || (!value && !symbol) || description?.length > 500 || value?.length > 250 || symbol?.length > 250) {
                res.status(400).json({ status: 'error', message: 'Invalid parameters' })
                return
            }
            const now = Date.now();
            const { requests } = await getCacheFromRedis(cacheKey, false) || { requests: [] };
            const key = `${account.toLowerCase()}-${symbol.toLowerCase()}`;

            if(requests.some(r => r.key === key)){
                res.status(400).json({ status: 'error', message: 'Already requested!' });
                return
            }

            requests.push({ key, timestamp: now, account, value, symbol, description, wouldUse });
            
            await redisSetWithTimestamp(cacheKey, { timestamp: now, requests });
            res.json({ status: 'success' });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}