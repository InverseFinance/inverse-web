import 'source-map-support'
import { getCacheFromRedis, getRedisClient, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { RefundableTransaction } from '@app/types';
import { ONE_DAY_MS } from '@app/config/constants';
import { formatEther } from '@ethersproject/units';
import { capitalize, timestampToUTC, uniqueBy } from '@app/util/misc';

const client = getRedisClient();

const topics = {
  "0xdcc16fd18a808d877bcd9a09b544844b36ae8f0a4b222e317d7b777b2c18b032": "Expansion",
  "0x32d275175c36fa468b3e61c6763f9488ff3c9be127e35e011cf4e04d602224ba": "Contraction",
}

export const ELIGIBLE_TXS = 'eligible-refunds-txs';
export const REFUNDED_TXS_CACHE_KEY = 'refunded-txs-epoch4';
export const REFUNDED_TXS_CUSTOM_CACHE_KEY = 'custom-txs-to-refund-v2';
export const REFUNDED_TXS_IGNORE_CACHE_KEY = 'refunds-ignore-tx-hashes';

export const formatTxResults = (data: any, type: string, refundWhitelist?: string[], voteCastWhitelist?: string[]): RefundableTransaction[] => {
  if (data === null) {
    return [];
  }
  const { items, chain_id } = data;
  return items
    .filter(item => typeof item.fees_paid === 'string' && /^[0-9\.]+$/.test(item.fees_paid))
    .map(item => {
      const decodedArr = item.log_events?.map(e => e.decoded).filter(d => !!d);
      const fedLog = item.log_events
        .find(e => (['Contraction', 'Expansion'].includes(e?.decoded?.name) || !!e?.raw_log_topics?.find(r => !!topics[r])));
      const isFed = !!fedLog;
      const isContraction = fedLog?.decoded?.name === 'Contraction' || !!fedLog?.raw_log_topics?.find(rawTopic => topics[rawTopic] === 'Contraction')
      const decoded = isFed ? { name: isContraction ? 'Contraction' : 'Expansion' } : decodedArr[0];
      const isContractCreation = !item.to_address;
      const log0 = (item.log_events && item.log_events[0] && item.log_events[0]) || {};
      const to = item.to_address || log0.sender_address;
      const name = (isContractCreation ? 'ContractCreation' : !!decoded ? decoded.name || `${capitalize(type)}Other` : type === 'oracle' ? 'Keep3rAction' : `${capitalize(type)}Other`) || 'Unknown';

      return {
        from: item.from_address,
        to: to,
        txHash: item.tx_hash,
        timestamp: Date.parse(item.block_signed_at),
        successful: item.successful,
        fees: formatEther(item.fees_paid),
        name,
        contractTicker: isContractCreation ? log0.sender_contract_ticker_symbol : undefined,
        contractName: isContractCreation ? log0.sender_name : undefined,
        chainId: chain_id,
        type: isFed ? 'fed' : type,
        refunded: false,
        block: item.block_height,
      }
    })
    .filter(item => item.name === 'VoteCast' && voteCastWhitelist ?
      voteCastWhitelist.includes(item.from.toLowerCase())
      :
      type === 'custom' || refundWhitelist.includes(item.from.toLowerCase())
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
  // UTC
  const { startDate, endDate, preferCache, multisig, filterType } = req.query;

  if (isInvalidGenericParam(startDate) || isInvalidGenericParam(endDate) || isInvalidGenericParam(preferCache) || isInvalidGenericParam(multisig) || isInvalidGenericParam(filterType)) {
    res.status(400).json({ transactions: [], msg: 'invalid request' });
    return;
  }

  const _multisigFilter = filterType === 'multisig' ? multisig : '';
  const nowTs = +(new Date());
  const todayUtc = timestampToUTC(nowTs);
  const includesToday = todayUtc === endDate;
  const cacheKey = `refunds-v1.0.6-${startDate}-${endDate}${filterType || ''}${_multisigFilter || ''}`;

  try {    
    res.setHeader('Cache-Control', `public, max-age=${30}`);
    const validCache = await getCacheFromRedis(cacheKey, true, includesToday && preferCache !== 'true' ? 30 : 3600);
    if (validCache) {
      // refunded txs, manually submitted by signature in UI
      const refunded = JSON.parse(await client.get(REFUNDED_TXS_CACHE_KEY) || '[]');
      res.status(200).json({
        transactions: addRefundedData(validCache.transactions, refunded),
        cachedMostRecentTimestamp: validCache.cachedMostRecentTimestamp,
      });
      return
    }

    const [startYear, startMonth, startDay] = (startDate || '').split('-');
    const startTimestamp = /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(startDate) ? Date.UTC(+startYear, +startMonth - 1, +startDay) : Date.UTC(2022, 4, 10);

    const [endYear, endMonth, endDay] = (endDate || '').split('-');

    const endTimestamp = /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(endDate) ? Date.UTC(+endYear, +endMonth - 1, +endDay, 23, 59, 59) : null;
    const deltaDays = Math.round(Math.abs((endTimestamp || nowTs) - startTimestamp) / ONE_DAY_MS);

    if (deltaDays > 5 && preferCache === 'true') {
      res.status(400).json({ transactions: [], msg: 'invalid request' });
      return;
    }

    const hasFilter = !!filterType;

    const [
      customTxsRes,
      ignoreTxsRes,
      refundedRes,
    ] = await Promise.all([
      !hasFilter || filterType === 'custom' ? client.get(REFUNDED_TXS_CUSTOM_CACHE_KEY) : new Promise((r) => r('[]')),
      client.get(REFUNDED_TXS_IGNORE_CACHE_KEY),
      client.get(REFUNDED_TXS_CACHE_KEY),
    ]);

    const customTxs = JSON.parse((customTxsRes || '[]'));
    const refunded = JSON.parse((refundedRes || '[]'));

    const cached = (await getCacheFromRedis(ELIGIBLE_TXS, false, 0, true)) || { formattedTxs: [] };
    const cachedTxs = cached?.formattedTxs || [];
    const cachedMostRecentTimestamp = cached.timestamp;

    let totalItems = customTxs.concat(cachedTxs)

    const ignoredTxs = JSON.parse(ignoreTxsRes || '[]');

    totalItems = totalItems
      .filter(t =>
        t.timestamp >= startTimestamp
        && ((!!endTimestamp && t.timestamp <= endTimestamp) || !endTimestamp)
        && !ignoredTxs.includes(t.txHash)
        && t.name !== 'Bonded'
        && (hasFilter ? t.type === filterType || (t.type === 'fed' && filterType === 'multisig') : true)
        && (hasFilter && multisig ? t.multisig === multisig : true)
      );

    totalItems = uniqueBy(totalItems, (o1, o2) => o1.txHash === o2.txHash);
    totalItems.sort((a, b) => a.timestamp - b.timestamp);

    const resultData = {
      transactions: addRefundedData(totalItems, refunded),
      cachedMostRecentTimestamp,
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
      } else {
        res.status(500).json({ status: 'ko' });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ status: 'ko' });
    }
  }
}
