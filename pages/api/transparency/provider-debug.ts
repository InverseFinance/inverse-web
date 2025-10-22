import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { Contract } from 'ethers';
import { MULTISIG_ABI } from '@app/config/abis';

const { MULTISIGS } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const { include, exclude } = req.query;
    const inc = include ? include.split(',') : [];
    const exc = exclude ? exclude.split(',') : [];
    try {
        const multisigsToShow = MULTISIGS.filter(m => !!include ? inc.includes(m.chainId) : true && !!exclude ? !exc.includes(m.chainId) : true);

        const [multisigsOwners, multisigsThresholds] = await Promise.all([
          Promise.all(multisigsToShow.map((m) => {
            const provider = getProvider(m.chainId);
            const contract = new Contract(m.address, MULTISIG_ABI, provider);
            return contract.getOwners();
          })),
          Promise.all(multisigsToShow.map((m) => {
            const provider = getProvider(m.chainId);
            const contract = new Contract(m.address, MULTISIG_ABI, provider);
            return contract.getThreshold();
          })),
        ]);
        
        return res.status(200).json({
          inc,
          exc,
          include, 
          exclude,
          multisigsToShow,
          multisigsOwners,
          multisigsThresholds,
        });
    } catch (err) {
      res.status(500).json({ success: false, err });
    }
}