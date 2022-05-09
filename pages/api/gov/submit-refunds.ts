
import { isProposalFormInvalid, isProposalActionInvalid, getProposalActionFromFunction } from '@app/util/governance';
import { getRedisClient } from '@app/util/redis';
import { ProposalFormActionFields } from '@app/types';
import { verifyMessage } from 'ethers/lib/utils';
import { DRAFT_SIGN_MSG, DRAFT_WHITELIST, REFUND_TX_SIGN_MSG } from '@app/config/constants';

const client = getRedisClient();

export default async function handler(req, res) {
    const {
        method,
    } = req
    let refunded

    switch (method) {
        case 'POST':
            try {
                const { sig, ...refunds } = req.body;
                const whitelisted = REFUND_TX_SIGN_MSG;
                const sigAddress = verifyMessage(DRAFT_SIGN_MSG, sig).toLowerCase();

                if (!whitelisted.includes(sigAddress)) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                };

                refunded = JSON.parse(await client.get('refunded-txs') || '[]');
                
                refunds.forEach(r => {
                    const foundExisting = refunded.findIndex(past => past.txHash === r.txHash);
                    const refund = { ...r, signedAt: Date.now(), signedBy: sigAddress };
                    if(foundExisting) {
                        refunded.splice(foundExisting, 1);
                    } else {
                        refunded.unshift(refund);
                    };
                });

                await client.set('refunded-txs', JSON.stringify(refunded));

                res.status(200).json({ status: 'success' })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}