import "source-map-support";
import { getNetworkConfig } from '@inverse/config/networks';
import { getRedisClient } from '@inverse/util/redis';
import { NetworkIds } from '@inverse/types';

const client = getRedisClient();

export default async function handler(req, res) {
  try {
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(NetworkIds.mainnet, true)!;
    if(!networkConfig?.governance) {
      res.status(403).json({ success: false, message: `No Governance support on ${networkConfig.chainId} network` });
    }
    let data: any = await client.get(`${networkConfig.chainId}-delegates`);

    if (!data) {
      res.status(404).json({success:false});
      return;
    } else {
      data = JSON.parse(data)
    }

    res.status(200).json( {
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
      delegates: data.data,
    });
  } catch (err) {
    console.error(err);
  }
};
