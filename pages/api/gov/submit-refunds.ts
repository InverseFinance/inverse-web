import { getRedisClient } from '@app/util/redis';
import { RefundableTransaction } from '@app/types';
import { getProvider } from '@app/util/providers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { verifyMessage } from 'ethers/lib/utils';
import { SIGN_MSG } from '@app/config/constants';

const client = getRedisClient();

const { MULTISIGS } = getNetworkConfigConstants();
const TWG = MULTISIGS.find(m => m.shortName === 'TWG')!;

export default async function handler(req, res) {
    const {
        method,
    } = req
    let refunded: RefundableTransaction[]

    switch (method) {
        case 'POST':
            try {
                const { refunds, refundTxHash, sig } = req.body;

                const provider = getProvider(process.env.NEXT_PUBLIC_CHAIN_ID!);

                if(refundTxHash) {
                    const tx = await provider.getTransaction(refundTxHash);

                    if (!tx) {
                        res.status(401).json({ status: 'warning', message: 'Refund TX not found' })
                        return
                    }

                    const { from } = tx;

                    if (from.toLowerCase() !== TWG.address.toLowerCase()) {
                        res.status(401).json({ status: 'warning', message: 'Unauthorized: TWG only' })
                        return
                    };
                } else {
                    const sigAddress = verifyMessage(SIGN_MSG, sig).toLowerCase();

                    if (sigAddress.toLowerCase() !== TWG.address.toLowerCase()) {
                        res.status(401).json({ status: 'warning', message: 'Unauthorized: Only TWG' })
                        return
                    };
                }

                const signedAt = Date.now();

                refunded = JSON.parse(await client.get('refunded-txs') || '[]');
                const ignoredTxHashes = JSON.parse(await client.get('refunds-ignore-tx-hashes') || '[]');
                refunds.forEach(r => {
                    const existingIndex = refunded.findIndex(past => past.txHash === r.txHash);
                    const refund = { ...r, refunded: !!refundTxHash, signedAt, signedBy: TWG.address, refundTxHash };
                    if (!refundTxHash) {
                        ignoredTxHashes.push(r.txHash);
                    } else if (existingIndex !== -1) {
                        refunded[existingIndex] = refund;
                    } else {
                        refunded.push(refund);
                    };
                });

                await Promise.all([
                    client.set('refunded-txs', JSON.stringify(refunded)),
                    client.set('refunds-ignore-tx-hashes', JSON.stringify(ignoredTxHashes)),
                ]);

                if(!refundTxHash) {
                    // remove previously added custom txs if ignored now
                    const customTxs = JSON.parse(await client.get('custom-txs-to-refund') || '[]');
                    await client.set('custom-txs-to-refund', customTxs.filter(t => !ignoredTxHashes.includes(t.tx_hash))); 
                }

                res.status(200).json({
                    status: 'success',
                    message: 'Refunds Updated',
                    refunds,
                    signedAt,
                    signedBy: TWG.address,
                    refundTxHash,
                })
            } catch (e) {
                console.log(e);
                res.status(500).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}