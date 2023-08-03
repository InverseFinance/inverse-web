import { POA_CURRENT_MSG_TO_SIGN, POA_VERSION } from '@app/config/proof-of-agreement-texts';
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

    const key = `poa-sign-${address}`;
    const checkResult = await getCacheFromRedis(key, false, 600);

    switch (method) {
        case 'GET':
            res.status(200).json(checkResult || { accepted: false });
            break
        case 'POST':
            if(checkResult) {
                res.status(200).json(checkResult);
                return;
            }
            const { sig } = req.body
            let sigAddress = '';

            try {
                sigAddress = verifyMessage(POA_CURRENT_MSG_TO_SIGN, sig);
            } catch (e) {
                console.log(e);
            }

            if (sigAddress.toLowerCase() !== address.toLowerCase()) {
                res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                return
            };

            const result = { accepted: true, signature: sig, timestamp: Date.now(), version: POA_VERSION };
            await redisSetWithTimestamp(key, result);
            res.status(200).json({ accepted: result.accepted, timestamp: result.timestamp });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}