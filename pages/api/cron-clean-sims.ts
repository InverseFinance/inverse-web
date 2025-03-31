import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { SIMS_CACHE_KEY } from './drafts/sim';

const { TENDERLY_USER, TENDERLY_KEY } = process.env;

const deleteVnet = async (id: string) => {
  return fetch(`https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/inverse-finance2/vnets/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Access-Key': TENDERLY_KEY as string,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

  try {
    const cached = (await getCacheFromRedis(SIMS_CACHE_KEY, false));
    const { lastSimId, ids } = cached || { lastSimId: 0, ids: [] };
    let successfulDeletes: boolean[] = [];

    // Delete the oldest 30 sims, keep at least 30
    if (ids?.length >= 60) {
      const urls = ids.slice(0, 30).map(simData => `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/inverse-finance2/vnets/${simData.id}`);
      const responses = await Promise.allSettled(urls.map(deleteVnet));
      successfulDeletes = responses.map(r => r.status === 'fulfilled' ? true : false);
      if (successfulDeletes.some(Boolean)) {
        await redisSetWithTimestamp(SIMS_CACHE_KEY, { lastSimId, ids: ids.filter((_, i) => !successfulDeletes[i]) });
      }
    }

    res.status(200).json({ success: true, nbDeleted: successfulDeletes.filter(Boolean).length });

  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}