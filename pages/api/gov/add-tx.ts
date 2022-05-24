import { getRedisClient } from '@app/util/redis';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getTx } from '@app/util/covalent';
import { verifyMessage } from 'ethers/lib/utils';
import { SIGN_MSG } from '@app/config/constants';

const client = getRedisClient();

const { MULTISIGS } = getNetworkConfigConstants();
const TWG = MULTISIGS.find(m => m.shortName === 'TWG')!;

export default async function handler(req, res) {
    const {
        method,
    } = req

    switch (method) {
        case 'POST':
            try {
                const { txHash, sig } = req.body;

                const sigAddress = verifyMessage(SIGN_MSG, sig).toLowerCase();

                if (sigAddress.toLowerCase() !== TWG.address.toLowerCase()) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized: Only TWG' })
                    return
                };

                const customTxs = JSON.parse(await client.get('custom-txs-to-refund') || '[]');
                const alreadyAdded = customTxs.find(t => t.tx_hash.toLowerCase() === txHash.toLowerCase());

                if (!!alreadyAdded) {
                    res.status(401).json({ status: 'warning', message: 'TX already in list' })
                    return
                }

                const result = await getTx(txHash);

                if (!result?.data || !result?.data?.items?.length) {
                    res.status(401).json({ status: 'warning', message: 'TX not found' })
                    return
                } 

                const tx = result.data.items[0];
                customTxs.push(tx);

                await client.set('custom-txs-to-refund', JSON.stringify(customTxs));

                // remove from ignored hashes if now adding tx
                const ignoredTxHashes = JSON.parse(await client.get('refunds-ignore-tx-hashes') || '[]');
                await client.set('refunds-ignore-tx-hashes', ignoredTxHashes.filter(hash => hash !== txHash)); 
                
                res.status(200).json({
                    status: 'success',
                    message: 'Tx Added',
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