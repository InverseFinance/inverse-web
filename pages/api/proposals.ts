import "source-map-support";
import { createNodeRedisClient } from 'handy-redis';

const client = createNodeRedisClient({
  url: process.env.REDIS_URL
});

export default async function handler(req, res) {
  try {
    let data: any = await client.get("proposals");

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
