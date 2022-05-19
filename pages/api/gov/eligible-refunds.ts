import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, RefundableTransaction } from '@app/types';
import { getTxsOf } from '@app/util/covalent';
import { DRAFT_WHITELIST } from '@app/config/constants';
import { CUSTOM_NAMED_ADDRESSES } from '@app/variables/names';
import { formatEther } from '@ethersproject/units';
import { Contract } from 'ethers';
import { MULTISIG_ABI } from '@app/config/abis';
import { getProvider } from '@app/util/providers';
import { uniqueBy } from '@app/util/misc';

const client = getRedisClient();

const topics = {
  "0xdcc16fd18a808d877bcd9a09b544844b36ae8f0a4b222e317d7b777b2c18b032": "Expansion",
  "0x32d275175c36fa468b3e61c6763f9488ff3c9be127e35e011cf4e04d602224ba": "Contraction",
}

const invOracleKeeper = '0xd14439b3a7245d8ea92e37b77347014ea7e4f809';

const formatResults = (data: any, type: string, refundWhitelist: string[], voteCastWhitelist?: string[]): RefundableTransaction[] => {
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
        name: !!decoded ? decoded.name : item.to_address === invOracleKeeper ? 'Keep3rAction' : 'Unknown',
        chainId: chain_id,
        type,
        refunded: false,
        block: item.block_height,
      }
    })
    .filter(item => item.name === 'VoteCast' ?
      voteCastWhitelist.includes(item.from.toLowerCase())
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

  const { GOVERNANCE, MULTISIGS, MULTI_DELEGATOR, FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);
  // UTC
  const { startDate, endDate } = req.query;
  const cacheKey = `refunds-v1.0.2-${startDate}-${endDate}`;

  try {
    let refundWhitelist = [
      ...DRAFT_WHITELIST,
      ...Object.keys(CUSTOM_NAMED_ADDRESSES),
    ];

    // refunded txs, manually submitted by signature in UI
    const refunded = JSON.parse(await client.get('refunded-txs') || '[]');
    const now = new Date();
    const todayUtc = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1).toString().padStart(2, '0')}-${(now.getUTCDate()).toString().padStart(2, '0')}`;
    const validCache = await getCacheFromRedis(cacheKey, true, todayUtc === endDate ? 2 : 60);
    if (validCache) {
      res.status(200).json({ transactions: addRefundedData(validCache.transactions, refunded) });
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const multisigOwners = await Promise.all([
      ...MULTISIGS.filter(m => m.chainId === NetworkIds.mainnet).map(m => {
        const contract = new Contract(m.address, MULTISIG_ABI, provider);
        return contract.getOwners()
      })
    ]);

    multisigOwners.forEach(multisigOwners => {
      refundWhitelist = refundWhitelist.concat(multisigOwners);
    });
    refundWhitelist = refundWhitelist.map(a => a.toLowerCase());

    const delegates = JSON.parse(await client.get(`1-delegates`)).data;
    const eligibleVoteCasters = Object.values(delegates)
      .map(val => val)
      .filter(del => {
        return del.votingPower >= 500 && del.delegators.length > 2;
      }).map(del => del.address.toLowerCase());

    const [gov, multidelegator, gno, oracle, ...multisigsRes] = await Promise.all([
      getTxsOf(GOVERNANCE),
      getTxsOf(MULTI_DELEGATOR),
      // gnosis proxy, for creation
      getTxsOf('0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2'),
      // price feed update
      getTxsOf(invOracleKeeper),
      ...MULTISIGS.filter(m => m.chainId === NetworkIds.mainnet).map(m => getTxsOf(m.address, 100))
    ])

    const feds = await Promise.all([
      ...FEDS.filter(m => m.chainId === NetworkIds.mainnet).map(f => getTxsOf(f.address, 100))
    ])

    let totalItems = formatResults(gov.data, 'governance', refundWhitelist, eligibleVoteCasters)
      .concat(formatResults(multidelegator.data, 'multidelegator', refundWhitelist))
      .concat(formatResults(gno.data, 'gnosisproxy', refundWhitelist))
      .concat(formatResults(oracle.data, 'oracle', refundWhitelist))

    multisigsRes.forEach(r => {
      totalItems = totalItems.concat(formatResults(r.data, 'multisig', refundWhitelist))
    })
    feds.forEach(r => {
      totalItems = totalItems.concat(formatResults(r.data, 'fed', refundWhitelist))
    })

    const [startYear, startMonth, startDay] = (startDate || '').split('-');
    const startTimestamp = /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(startDate) ? Date.UTC(+startYear, +startMonth - 1, +startDay) : Date.UTC(2022, 4, 10);

    const [endYear, endMonth, endDay] = (endDate || '').split('-');
    const endTimestamp = /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(endDate) ? Date.UTC(+endYear, +endMonth - 1, +endDay, 23, 59, 59) : null;

    totalItems = totalItems
      .filter(t =>
        t.successful
        && t.timestamp >= startTimestamp
        && ((!!endTimestamp && t.timestamp <= endTimestamp) || !endTimestamp)
      );

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
