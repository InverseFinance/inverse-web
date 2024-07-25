import { REFERRAL_MSG } from '@app/components/common/Modal/ReferralModal';
import { BURN_ADDRESS } from '@app/config/constants';
import { POA_CURRENT_MSG_TO_SIGN, POA_VERSION } from '@app/config/proof-of-agreement-texts';
import { verifyMultisigMessage } from '@app/util/multisig';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { verifyMessage, hashMessage, isAddress } from 'ethers/lib/utils';

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { r } = query;

    if (!r || !isAddress(r) || r === BURN_ADDRESS) {
        res.status(400).json({ status: 'error', message: 'Invalid address' });
        return;
    }

    const key = `referrals`;
    const cachedResult = await getCacheFromRedis(key, false, 600);

    switch (method) {
        case 'GET':
            res.status(200).json(cachedResult || { referrals: {} });
            break
        case 'POST':

            const { sig } = req.body
            let sigAddress = '';
            let isMultisig = false;

            const sigText = REFERRAL_MSG + r;

            try {
                sigAddress = verifyMessage(sigText, sig);
            } catch (e) {
                console.log(e);
            }

            if (sigAddress?.toLowerCase() !== r.toLowerCase() || !sigAddress) {
                // try to verify as multisig
                let multisigVerifyResult;
                try {
                    multisigVerifyResult = await verifyMultisigMessage(r, hashMessage(sigText), sig);
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

            const result = { timestamp: Date.now(), referrals: { ...cachedResult?.referrals, [sigAddress]: { ref: r, timestamp: Date.now() } } };
            await redisSetWithTimestamp(key, result);
            res.status(200).json(result);
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}