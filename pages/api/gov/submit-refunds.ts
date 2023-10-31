import { getRedisClient } from '@app/util/redis';
import { RefundableTransaction } from '@app/types';
import { getProvider } from '@app/util/providers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { verifyMessage } from 'ethers/lib/utils';
import { SIGN_MSG } from '@app/config/constants';
import { Contract } from 'ethers';
import { MULTISIG_ABI } from '@app/config/abis';
import { REFUNDED_TXS_CACHE_KEY, REFUNDED_TXS_CUSTOM_CACHE_KEY, REFUNDED_TXS_IGNORE_CACHE_KEY } from './eligible-refunds';

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

                const contract = new Contract(TWG.address, MULTISIG_ABI, provider);
                const owners = await contract.getOwners();
                const authorizedAddresses = [...owners, TWG.address, '0x6535020cCeB810Bdb3F3cA5e93dE2460FF7989BB', '0xEC092c15e8D5A48a77Cde36827F8e228CE39471a'];

                const sigAddress = verifyMessage(SIGN_MSG, sig).toLowerCase();

                if (!authorizedAddresses.map(a => a.toLowerCase()).includes(sigAddress.toLowerCase())) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized: Only TWG members or TWG' })
                    return
                };

                if(refundTxHash) {
                    const tx = await provider.getTransaction(refundTxHash);

                    if (!tx) {
                        res.status(401).json({ status: 'warning', message: 'Refund TX not found' })
                        return
                    }
                }

                const signedAt = Date.now();

                refunded = JSON.parse(await client.get(REFUNDED_TXS_CACHE_KEY) || '[]');
                const ignoredTxHashes = JSON.parse(await client.get(REFUNDED_TXS_IGNORE_CACHE_KEY) || '[]');
                refunds.forEach(r => {
                    const existingIndex = refunded.findIndex(past => past.txHash === r.txHash);
                    const refund = { ...r, refunded: !!refundTxHash, signedAt, signedBy: sigAddress, refundTxHash };
                    if (!refundTxHash) {
                        ignoredTxHashes.push(r.txHash);
                    } else if (existingIndex !== -1) {
                        refunded[existingIndex] = refund;
                    } else {
                        refunded.push(refund);
                    };
                });

                await Promise.all([
                    client.set(REFUNDED_TXS_CACHE_KEY, JSON.stringify(refunded)),
                    client.set(REFUNDED_TXS_IGNORE_CACHE_KEY, JSON.stringify(ignoredTxHashes)),
                ]);

                if(!refundTxHash) {
                    // remove previously added custom txs if ignored now
                    const customTxs = JSON.parse(await client.get(REFUNDED_TXS_CUSTOM_CACHE_KEY) || '[]');
                    await client.set(REFUNDED_TXS_CUSTOM_CACHE_KEY, JSON.stringify(customTxs.filter(t => !ignoredTxHashes.includes(t.txHash)))); 
                }

                res.status(200).json({
                    status: 'success',
                    message: refundTxHash ? 'Refunds Updated' : 'Tx removed',
                    refunds,
                    signedAt,
                    signedBy: sigAddress,
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