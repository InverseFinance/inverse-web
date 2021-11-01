import "source-map-support";
import { createNodeRedisClient } from 'handy-redis';
import { getNetworkConfig } from '@inverse/config/networks';

const client = createNodeRedisClient({
  url: process.env.REDIS_URL
});

export default async function handler(req, res) {
  try {
    const { chainId = '1' } = req.query;
    const networkConfig = getNetworkConfig(chainId);
    if(!networkConfig?.governance) {
      res.status(403).json({ success: false, message: `No Governance support on ${chainId} network` });
    }
    let data: any = await client.get(`${chainId}-proposals`);

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
