import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, RefundableTransaction } from '@app/types';
import { getTxsOf } from '@app/util/covalent';
import { DRAFT_WHITELIST } from '@app/config/constants';
import { CUSTOM_NAMED_ADDRESSES } from '@app/variables/names';
import { formatEther } from '@ethersproject/units';

const client = getRedisClient();

const refundWhitelist = [
  ...DRAFT_WHITELIST,
  ...Object.keys(CUSTOM_NAMED_ADDRESSES),
]

const toCallSig = (name, params) => {
  return `${name}(${params?.map(p => p.value).join(', ')})`
}

const formatResults = (data, type): RefundableTransaction[] => {
  const { items, chain_id } = data;
  return items
    .map(item => {
      const decoded = item.log_events?.map(e => e.decoded).filter(d => !!d).slice(0, 1);
      const hasDecoded = !!decoded?.length;
      return {
        from: item.from_address,
        to: item.to_address,
        txHash: item.tx_hash,
        timestamp: Date.parse(item.block_signed_at),
        successful: item.successful,
        fees: formatEther(item.fees_paid),
        name: hasDecoded ? decoded[0]?.name : 'Unknown',
        call: hasDecoded ? toCallSig(decoded[0].name, decoded[0].params) : '',
        chainId: chain_id,
        type,
        refunded: false,
        block: item.block_height,
      }
    })
    .filter(item => type === 'governance' ?
      refundWhitelist.includes(item.from.toLowerCase()) || item.name !== 'VoteCast'
      :
      refundWhitelist.includes(item.from.toLowerCase())
    )
}

const addRefundedData = (transactions: RefundableTransaction[], refunded) => {
  const txs = [...transactions];
  refunded.forEach(r => {
    const found = transactions.findIndex(t => t.txHash === r.txHash);
    if(found !== -1) {
      txs[found] = { ...txs[found], refunded: true, ...r }
    }
  })
  return txs;
}

export default async function handler(req, res) {

  const { GOVERNANCE, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `refunds-v1.0.0`;

  try {

    // refunded txs, manually submitted by signature in UI
    const refunded = JSON.parse(await client.get('refunded-txs') || '[]');

    const validCache = await getCacheFromRedis(cacheKey, true, 60);
    if (validCache) {
      res.status(200).json({ transactions: addRefundedData(validCache.transactions, refunded) });
      return
    }

    const [gov, multisigs] = await Promise.all([
      getTxsOf(GOVERNANCE, 1000, 0, NetworkIds.mainnet),
      ...MULTISIGS.map(m => getTxsOf(m.address, 1000, 0, m.chainId))
    ])

    const totalItems = formatResults(gov.data, 'governance')
      .concat(formatResults(multisigs.data, 'multisig'))
      .filter(t => t.block >= 14746112 && t.successful)
      .sort((a, b) => a.timestamp - b.timestamp);

    const resultData = {
      transactions: addRefundedData(totalItems, refunded),
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
