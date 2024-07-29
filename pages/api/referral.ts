import { getReferralMsg } from '@app/components/common/Modal/ReferralModal';
import { BURN_ADDRESS } from '@app/config/constants';
import { verifyMultisigMessage } from '@app/util/multisig';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { verifyMessage, hashMessage, isAddress } from 'ethers/lib/utils';

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { r, account, csv } = query;

    const key = `referrals`;
    const cachedResult = await getCacheFromRedis(key, false, 600);

    switch (method) {
        case 'GET':
            if(csv === 'true') {
                let CSV = `Account,Referrer,Date\n`;
                const arr = Object.entries(cachedResult?.referrals||[]);
                arr.forEach(([account, accountRefData]) => {
                    CSV += `${account.toLowerCase()},${accountRefData.ref.toLowerCase()},${(new Date(accountRefData.timestamp).toUTCString()).replace(/,/g, '')}\n`;
                });
                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", "attachment; filename=referrals.csv");
                res.status(200).send(CSV);
            } else {
                res.status(200).json(cachedResult || { referrals: {} });
            }
            break
        case 'POST':

            if (!r || !isAddress(r) || r === BURN_ADDRESS || !account || !isAddress(account) || account === BURN_ADDRESS || r.toLowerCase() === account.toLowerCase()) {
                res.status(400).json({ status: 'error', message: 'Invalid address' });
                return;
            }

            const { sig } = req.body
            let sigAddress = '';

            const sigText = getReferralMsg(account, r);

            try {
                sigAddress = verifyMessage(sigText, sig);
            } catch (e) {
                console.log(e);
            }

            if (sigAddress?.toLowerCase() !== account.toLowerCase() || !sigAddress) {
                // try to verify as multisig
                let multisigVerifyResult;
                try {
                    multisigVerifyResult = await verifyMultisigMessage(account, hashMessage(sigText), sig);
                } catch (e) {
                    console.log('multisig verify error');
                    console.log(e);
                }
                if (!multisigVerifyResult?.valid) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
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