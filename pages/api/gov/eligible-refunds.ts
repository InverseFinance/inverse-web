import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, RefundableTransaction } from '@app/types';
import { getTxsOf } from '@app/util/covalent';
import { DRAFT_WHITELIST } from '@app/config/constants';
import { CUSTOM_NAMED_ADDRESSES } from '@app/variables/names';
import { formatEther } from '@ethersproject/units';
import { Contract } from 'ethers';
import { ORACLE_ABI } from '@app/config/abis';
import { getProvider } from '@app/util/providers';
import { uniqueBy } from '@app/util/misc';

const client = getRedisClient();

const refundWhitelist = [
  ...DRAFT_WHITELIST,
  ...Object.keys(CUSTOM_NAMED_ADDRESSES),
].map(a => a.toLowerCase());

const topics = {
  "0xdcc16fd18a808d877bcd9a09b544844b36ae8f0a4b222e317d7b777b2c18b032": "Expansion",
  "0x32d275175c36fa468b3e61c6763f9488ff3c9be127e35e011cf4e04d602224ba": "Contraction",
}

const formatResults = (data, type): RefundableTransaction[] => {
  const { items, chain_id } = data;
  return items
    .filter(item => typeof item.fees_paid === 'string' && /^[0-9\.]+$/.test(item.fees_paid))
    .map(item => {
      const decodedArr = item.log_events?.map(e => e.decoded).filter(d => !!d);
      const decoded = type === "fed" ? { name: topics[item?.log_events[0]?.raw_log_topics[0]] } : decodedArr[0];
      return {
        from: item.from_address,
        to: item.to_address,
        txHash: item.tx_hash,
        timestamp: Date.parse(item.block_signed_at),
        successful: item.successful,
        fees: formatEther(item.fees_paid),
        name: !!decoded ? decoded.name : 'Unknown',
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
    if (found !== -1) {
      txs[found] = { ...txs[found], refunded: true, ...r, call: undefined }
    }
  })
  return txs;
}

export default async function handler(req, res) {

  const { GOVERNANCE, MULTISIGS, MULTI_DELEGATOR, FEDS, ORACLE, XINV } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `refunds-v1.0.0`;

  try {

    // refunded txs, manually submitted by signature in UI
    const refunded = JSON.parse(await client.get('refunded-txs') || '[]');

    const validCache = await getCacheFromRedis(cacheKey, true, 10);
    if (validCache) {
      res.status(200).json({ transactions: addRefundedData(validCache.transactions, refunded) });
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const oracleContract = new Contract(ORACLE, ORACLE_ABI, provider);

    const invOracle = await oracleContract.feeds(XINV);

    const [gov, multidelegator, gno, oracle, ...multisigsRes] = await Promise.all([
      getTxsOf(GOVERNANCE),
      getTxsOf(MULTI_DELEGATOR),
      getTxsOf('0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2'),
      getTxsOf(invOracle),
      ...MULTISIGS.filter(m => m.chainId === NetworkIds.mainnet).map(m => getTxsOf(m.address, 100))
    ])

    const feds = await Promise.all([
      ...FEDS.filter(m => m.chainId === NetworkIds.mainnet).map(f => getTxsOf(f.address, 100))
    ])

    let totalItems = formatResults(gov.data, 'governance')
      .concat(formatResults(multidelegator.data, 'multidelegator'))
      .concat(formatResults(gno.data, 'gnosis'))
      .concat(formatResults(oracle.data, 'oracle'))

    multisigsRes.forEach(r => {
      totalItems = totalItems.concat(formatResults(r.data, 'multisig'))
    })
    feds.forEach(r => {
      totalItems = totalItems.concat(formatResults(r.data, 'fed'))
    })

    totalItems = totalItems
      .filter(t => t.timestamp >= Date.UTC(2022, 4, 10) && t.successful);

    totalItems = uniqueBy(totalItems, (o1, o2) => o1.txHash === o2.txHash);
    totalItems.sort((a, b) => a.timestamp - b.timestamp);

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
