import { POA_CURRENT_MSG_TO_SIGN, POA_VERSION } from '@app/config/proof-of-agreement-texts';
import { verifyMultisigMessage } from '@app/util/multisig';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { verifyMessage, hashMessage } from 'ethers/lib/utils';

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
            if (checkResult) {
                res.status(200).json(checkResult);
                return;
            }
            const { sig } = req.body
            let sigAddress = '';
            let isMultisig = false;

            try {
                sigAddress = verifyMessage(POA_CURRENT_MSG_TO_SIGN, sig);
            } catch (e) {
                console.log(e);
            }

            if (sigAddress?.toLowerCase() !== address.toLowerCase() || !sigAddress) {
                // try to verify as multisig
                let multisigVerifyResult;
                try {
                    multisigVerifyResult = await verifyMultisigMessage(address, hashMessage(POA_CURRENT_MSG_TO_SIGN), sig);
                } catch (e) {
                    console.log('multisig verify error');
                    console.log(e);
                }
                if (!multisigVerifyResult?.valid) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                } else {
                    isMultisig = true;
                }
            };

            const result = { accepted: true, signature: sig, isMultisig, timestamp: Date.now(), version: POA_VERSION };
            await redisSetWithTimestamp(key, result);
            res.status(200).json({ accepted: result.accepted, timestamp: result.timestamp });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}