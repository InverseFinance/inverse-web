import "source-map-support";
import { getNetworkConfig } from '@inverse/config/networks';
import { getRedisClient } from '@inverse/util/redis';

const client = getRedisClient();

export default async function handler(req, res) {
  try {
    const { chainId = '1' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(chainId, true)!;
    if(!networkConfig?.governance) {
      res.status(403).json({ success: false, message: `No Governance support on ${networkConfig.chainId} network` });
    }
    let data: any = await client.get(`${networkConfig.chainId}-proposals`);

    if (!data) {
      res.status(404).json({success:false});
      return;
    } else {
      data = JSON.parse(data)
    }

    res.status(200).json( {
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
      proposals: data.data,
    });
  } catch (err) {
    console.error(err);
  }
};
