import "source-map-support";
import { getNetworkConfig } from '@app/util/networks';
import { getRedisClient } from '@app/util/redis';
import { NetworkIds } from '@app/types';

const client = getRedisClient();

export default async function handler(req, res) {
  const { filter = '' } = req.query;
  const cacheDuration = 60;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
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

    const delegates = filter ? { [filter]: data.data[filter] } : data.data

    res.status(200).json( {
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
      delegates: delegates,
    });
  } catch (err) {
    console.error(err);
  }
};
