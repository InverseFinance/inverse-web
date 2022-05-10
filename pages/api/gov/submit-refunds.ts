import { getRedisClient } from '@app/util/redis';
import { verifyMessage } from 'ethers/lib/utils';
import { DRAFT_WHITELIST, SIGN_MSG } from '@app/config/constants';
import { RefundableTransaction } from '@app/types';

const client = getRedisClient();

export default async function handler(req, res) {
    const {
        method,
    } = req
    let refunded: RefundableTransaction[]

    switch (method) {
        case 'POST':
            try {
                const { sig, refunds, refundTxHash } = req.body;
                const whitelisted = DRAFT_WHITELIST;
                const signedBy = verifyMessage(SIGN_MSG, sig).toLowerCase();

                if (!whitelisted.includes(signedBy)) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                };

                const signedAt = Date.now()

                refunded = JSON.parse(await client.get('refunded-txs') || '[]');
                refunds.forEach(r => {
                    const existingIndex = refunded.findIndex(past => past.txHash === r.txHash);
                    const refund = { ...r, refunded: !!refundTxHash, signedAt, signedBy, refundTxHash };
                    if (existingIndex !== -1 && !refundTxHash) {
                        refunded.splice(existingIndex, 1);
                    } else if (existingIndex !== -1) {
                        refunded[existingIndex] = refund;
                    } else {
                        refunded.push(refund);
                    };
                });

                await client.set('refunded-txs', JSON.stringify(refunded));

                res.status(200).json({ status: 'success', message: 'Refunds Updated', refunds, signedAt, signedBy })
            } catch (e) {
                res.status(500).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}