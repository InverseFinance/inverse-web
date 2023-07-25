import { TOS } from '@app/config/tos-texts';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { verifyMessage } from 'ethers/lib/utils';

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { address } = query;

    if (isInvalidGenericParam(address)) {
        console.log('invalid address');
        res.status(400).json({ status: 'error', message: 'Invalid address' });
        return;
    }

    const key = `tos-sign-${address}`;

    switch (method) {
        case 'GET':
            const checkResult = await getCacheFromRedis(key, false, 600);
            res.status(200).json(checkResult || { accepted: false });
            break
        case 'POST':

            const { sig } = req.body
            let sigAddress = '';

            try {
                sigAddress = verifyMessage(TOS.join('\n\n'), sig);
            } catch (e) {
                console.log(e);
            }

            if (sigAddress.toLowerCase() !== address.toLowerCase()) {
                res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                return
            };

            const result = { accepted: true, signature: sig, timestamp: Date.now() };
            await redisSetWithTimestamp(key, result);
            res.status(200).json(result);
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}