import { getRedisClient } from '@app/util/redis';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getTx } from '@app/util/covalent';

const client = getRedisClient();

export default async function handler(req, res) {
    const {
        method,
    } = req

    switch (method) {
        case 'POST':
            try {
                const { txHash } = req.body;

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