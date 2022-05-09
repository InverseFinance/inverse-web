import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getRedisClient } from '@app/util/redis';
import { getTxsOf } from '@app/util/covalent';
import { DRAFT_WHITELIST } from '@app/config/constants';
import { CUSTOM_NAMED_ADDRESSES } from '@app/variables/names';
import { formatEther } from '@ethersproject/units';

const client = getRedisClient()

const refundWhitelist = [
  ...DRAFT_WHITELIST,
  ...Object.keys(CUSTOM_NAMED_ADDRESSES),
]

const formatResults = (data) => {
  const { items, chain_id } = data;
  return items
    .filter(item => refundWhitelist.includes(item.from_address))
    .map(item => {
      return {
        from: item.from_address,
        txHash: item.tx_hash,
        timestamp: Date.parse(item.block_signed_at),
        successful: item.successful,
        fees: formatEther(item.fees_paid),
        name: item.log_events?.map(e => e.decoded?.name),
        events: item.log_events?.map(e => e.decoded),
        chainId: chain_id,
      }
    })
}

export default async function handler(req, res) {

  const { GOVERNANCE, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `refunds-v1.0.0`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 150);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const [gov, multisigs] = await Promise.all([
      getTxsOf(GOVERNANCE),
      ...MULTISIGS.map(m => getTxsOf(m.address, 1000, 0, m.chainId))
    ])

    const resultData = {
      gov: formatResults(gov.data),
      multisigs: formatResults(multisigs.data),
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
