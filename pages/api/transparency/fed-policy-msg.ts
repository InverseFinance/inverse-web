
import { getRedisClient } from '@app/util/redis';
import { verifyMessage } from 'ethers/lib/utils';
import { FED_POLICY_SIGN_MSG } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types';

const client = getRedisClient();
const redisKey = 'fed-policy-msg';
const { DEPLOYER } = getNetworkConfigConstants(NetworkIds.mainnet);

export default async function handler(req, res) {
    const {
        method,
    } = req

    switch (method) {
        case 'GET':
            const msg = (await client.get(redisKey)) || '{"msg": "No guidance at the moment","lastUpdate": null}';
            res.status(200).json({ status: 'success', fedPolicyMsg: JSON.parse(msg) })
            break
        case 'POST':
            try {
                const { sig, msg } = req.body
                const sigAddress = verifyMessage(FED_POLICY_SIGN_MSG, sig).toLowerCase();
                
                if (sigAddress.toLocaleLowerCase() !== DEPLOYER.toLocaleLowerCase()) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                };
                
                await client.set(redisKey, JSON.stringify({ msg, lastUpdate: Date.now() }));

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