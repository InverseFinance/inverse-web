import "source-map-support";
import { createNodeRedisClient } from 'handy-redis';

const client = createNodeRedisClient({
  url: process.env.REDIS_URL
});

export default async function handler(req, res) {
  try {
    let data: any = await client.get("guard");

    if (!data) {
      data = [];
    } else {
      data = JSON.parse(data)
    }

    res.status(200).json( {
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
      plans: data.data,
    });
  } catch (err) {
    console.error(err);
  }
};
