import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getCacheFromRedis, getRedisClient, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, RefundableTransaction } from '@app/types';
import { getTxsOf } from '@app/util/covalent';
import { DRAFT_WHITELIST, ONE_DAY_MS } from '@app/config/constants';
import { CUSTOM_NAMED_ADDRESSES } from '@app/variables/names';
import { formatEther } from '@ethersproject/units';
import { Contract } from 'ethers';
import { MULTISIG_ABI, ORACLE_ABI } from '@app/config/abis';
import { getProvider } from '@app/util/providers';
import { capitalize, timestampToUTC, uniqueBy } from '@app/util/misc';
import { cacheMultisigMetaKey } from '../transparency/dao';

const client = getRedisClient();

const topics = {
  "0xdcc16fd18a808d877bcd9a09b544844b36ae8f0a4b222e317d7b777b2c18b032": "Expansion",
  "0x32d275175c36fa468b3e61c6763f9488ff3c9be127e35e011cf4e04d602224ba": "Contraction",
}

export const ELIGIBLE_TXS = 'eligible-refunds-txs';
export const REFUNDED_TXS_CACHE_KEY = 'refunded-txs-epoch2';
export const REFUNDED_TXS_CUSTOM_CACHE_KEY = 'custom-txs-to-refund-epoch2';
export const REFUNDED_TXS_IGNORE_CACHE_KEY = 'refunds-ignore-tx-hashes';

const formatResults = (data: any, type: string, refundWhitelist: string[], voteCastWhitelist?: string[]): RefundableTransaction[] => {
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

  const { GOVERNANCE, MULTISIGS, MULTI_DELEGATOR, FEDS, ORACLE, XINV } = getNetworkConfigConstants(NetworkIds.mainnet);
  // UTC
  const { startDate, endDate, preferCache, multisig, filterType } = req.query;

  if(isInvalidGenericParam(startDate) || isInvalidGenericParam(endDate) || isInvalidGenericParam(preferCache) || isInvalidGenericParam(multisig) || isInvalidGenericParam(filterType)){
    res.status(400).json({ transactions: [], msg: 'invalid request' });
    return;
  }

  const _multisigFilter = filterType === 'multisig' ? multisig : '';
  const nowTs = +(new Date());
  const todayUtc = timestampToUTC(nowTs);
  const includesToday = todayUtc === endDate;
  const cacheKey = `refunds-v1.0.3-${startDate}-${endDate}${!includesToday ? '-archive' : ''}${filterType || ''}${_multisigFilter || ''}`;

  try {
    let refundWhitelist = [
      ...DRAFT_WHITELIST,
      ...Object.keys(CUSTOM_NAMED_ADDRESSES),
    ];

    // refunded txs, manually submitted by signature in UI
    const refunded = JSON.parse(await client.get(REFUNDED_TXS_CACHE_KEY) || '[]');

    const validCache = await getCacheFromRedis(cacheKey, includesToday, includesToday && preferCache !== 'true' ? 30 : 3600);
    if (validCache) {
      res.status(200).json({ transactions: addRefundedData(validCache.transactions, refunded) });
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const xinvFeed = await new Contract(ORACLE, ORACLE_ABI, provider).feeds(XINV);
    const xinvKeeperAddress = await new Contract(xinvFeed, ['function oracle() public view returns (address)'], provider).oracle();
    // old one, then we add the current one
    const invOracleKeepers = ['0xd14439b3a7245d8ea92e37b77347014ea7e4f809', xinvKeeperAddress];

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

    const [multisigsOwners] = (await getCacheFromRedis(cacheMultisigMetaKey, false)) || [[]];

    const [
      multisigsRes,
      gov,
      multidelegator,
      gno,
      oracleOld,
      oracleCurrent,
      // feds,
      customTxsRes,
      delegatesRes,
      ignoreTxsRes,
    ] = await Promise.all([
      Promise.all(
        MULTISIGS
          .filter(m => m.chainId === NetworkIds.mainnet && ((!!_multisigFilter && hasFilter && m.shortName === _multisigFilter) || !hasFilter || !_multisigFilter))
          .map(m => !hasFilter || filterType === 'multisig' ?
            getTxsOf(m.address, ['FedChair', 'TWG'].includes(m.shortName) ? deltaDays * 10 : deltaDays * 5)
            : new Promise((r) => r({ data: { items: [] } })))
      ),
      !hasFilter || filterType === 'gov' ? getTxsOf(GOVERNANCE, deltaDays * 3) : new Promise((r) => r({ data: { items: [] } })),
      !hasFilter || filterType === 'multidelegator' ? getTxsOf(MULTI_DELEGATOR, deltaDays * 3) : new Promise((r) => r({ data: { items: [] } })),
      // gnosis proxy, for creation
      !hasFilter || filterType === 'gnosis' ? getTxsOf('0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2', deltaDays * 5) : new Promise((r) => r({ data: { items: [] } })),
      // price feed update
      !hasFilter || filterType === 'oracles' ? getTxsOf(invOracleKeepers[0], deltaDays * 2) : new Promise((r) => r({ data: { items: [] } })),
      !hasFilter || filterType === 'oracles' ? getTxsOf(invOracleKeepers[1], deltaDays * 2) : new Promise((r) => r({ data: { items: [] } })),
      // Promise.all(FEDS.filter(m => m.chainId === NetworkIds.mainnet).map(f => getTxsOf(f.address, pageSize))),
      !hasFilter || filterType === 'custom' ? client.get(REFUNDED_TXS_CUSTOM_CACHE_KEY) : new Promise((r) => r('[]')),
      client.get(`1-delegates`),
      client.get(REFUNDED_TXS_IGNORE_CACHE_KEY),
    ])

    const customTxs = JSON.parse((customTxsRes || '[]'));

    const delegates = JSON.parse(delegatesRes).data;
    const eligibleVoteCasters = Object.values(delegates)
      .map(val => val)
      .filter(del => {
        return del.votingPower >= 500 && del.delegators.length > 2;
      }).map(del => del.address.toLowerCase());

    multisigsOwners.forEach(multisigOwners => {
      refundWhitelist = refundWhitelist.concat(multisigOwners);
    });
    refundWhitelist = refundWhitelist.map(a => a.toLowerCase());

    let totalItems = formatResults(gov.data, 'governance', refundWhitelist, eligibleVoteCasters)
      .concat(formatResults(multidelegator.data, 'multidelegator', refundWhitelist))
      .concat(formatResults(gno.data, 'gnosisproxy', refundWhitelist))
      .concat(formatResults(oracleOld.data, 'oracle', refundWhitelist))
      .concat(formatResults(oracleCurrent.data, 'oracle', refundWhitelist))
      .concat(formatResults({ items: customTxs, chainId: '1' }, 'custom', refundWhitelist))

    multisigsRes.forEach(r => {
      totalItems = totalItems.concat(formatResults(r.data, 'multisig', refundWhitelist))
    })
    // feds.forEach(r => {
    //   totalItems = totalItems.concat(formatResults(r.data, 'fed', refundWhitelist))
    // })

    const ignoredTxs = JSON.parse(ignoreTxsRes || '[]');

    totalItems = totalItems
      .filter(t =>
        t.timestamp >= startTimestamp
        && ((!!endTimestamp && t.timestamp <= endTimestamp) || !endTimestamp)
        && !ignoredTxs.includes(t.txHash)
        && t.name !== 'Bonded'
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
      } else {
        res.status(500).json({ status: 'ko' });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ status: 'ko' });
    }
  }
}
