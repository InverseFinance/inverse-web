import { LIQUIDATION_GRANTS_MSG_TO_SIGN } from '@app/components/common/Modal/LiquidationGrantsModal';
import { verifyMultisigMessage } from '@app/util/multisig';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis';
import { verifyMessage, hashMessage } from 'ethers/lib/utils';

const CAMPAIGNS = [
    'liquidation-grants',
];
const MSG_TO_SIGN = {
    'liquidation-grants': LIQUIDATION_GRANTS_MSG_TO_SIGN,
}

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { sig, form } = req.body;

    const { address, campaign } = query;

    if (isInvalidGenericParam(address)) {
        console.log('invalid address');
        res.status(400).json({ status: 'error', message: 'Invalid address' });
        return;
    } else if (!CAMPAIGNS.includes(campaign)) {
        res.status(400).json({ status: 'error', message: 'Invalid campaign' });
        return;
    }

    const key = `liquidation-grants-${campaign}-sign-${address}`;
    const cachedResult = (await getCacheFromRedis(key, false, 600));
    const readResult = cachedResult || { applied: false };
    const publicResult = { applied: readResult.applied, timestamp: readResult.timestamp };

    switch (method) {
        case 'GET':
            res.status(200).json(publicResult);
            break
        case 'POST':
            if (cachedResult) {
                res.status(200).json(publicResult);
                return;
            }
            const jsonForm = JSON.stringify(form);
            if (!address || /[<>]/i.test(jsonForm) || /(<script|alert\()/i.test(jsonForm) || /^test$/i.test(jsonForm)) {
                res.status(400).json({ status: 'error', message: 'Invalid values' })
                return
            }    
            let sigAddress = '';
            let isMultisig = false;

            const lcAddress = address.toLowerCase();

            const fullMsgToSign = MSG_TO_SIGN[campaign] + lcAddress;

            try {
                sigAddress = verifyMessage(fullMsgToSign, sig);
            } catch (e) {
                console.log(e);
            }

            if (sigAddress?.toLowerCase() !== lcAddress || !sigAddress) {
                // try to verify as multisig
                let multisigVerifyResult;
                try {
                    multisigVerifyResult = await verifyMultisigMessage(address, hashMessage(fullMsgToSign), sig);
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

            const result = { applied: true, signature: sig, form, isMultisig, timestamp: Date.now() };
            // await redisSetWithTimestamp(key, result);
            res.status(200).json({ status: 'success', applied: result.applied, timestamp: result.timestamp });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}