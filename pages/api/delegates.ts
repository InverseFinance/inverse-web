import "source-map-support";
import { createNodeRedisClient } from 'handy-redis';
import { getNetworkConfig } from '@inverse/config/networks';

const client = createNodeRedisClient({
  url: process.env.REDIS_URL
});

export default async function handler(req, res) {
  try {
    const { chainId = '1' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(chainId, true)!;
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
