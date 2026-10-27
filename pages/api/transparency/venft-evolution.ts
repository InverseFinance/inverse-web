import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Token } from '@app/types';
import { CHAIN_TOKENS, CHAIN_TOKEN_ADDRESSES } from '@app/variables/tokens';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { getBnToNumber, getHistoricalTokenData } from '@app/util/markets';
import { getMulticallOutput } from '@app/util/multicall';
import { BigNumber, Contract } from 'ethers';
import { VE_NFT_ABI } from '@app/config/abis';
import { getHistoricalProvider, getProvider } from '@app/util/providers';
import { getOrClosest, timestampToUTC, utcDateStringToTimestamp } from '@app/util/misc';
import { ONE_DAY_MS, ONE_DAY_SECS } from '@app/config/constants';
import { cgPricesCacheKey } from '../prices';

const startingBlocks = {
  // [NetworkIds.optimism]: 10078713,//veNft v1
  [NetworkIds.optimism]: 105896834,
  [NetworkIds.base]: 3200584,
  [NetworkIds.bsc]: 24435328,
  [NetworkIds.arbitrum]: 69988101,
}

// tokens with one veNft id or several (veNftIds)
const isVeNftToken = ({ veNftId, veNftIds }: Token) => !!veNftId || (veNftIds?.length || 0) > 0;

// staked veNfts with an evolution backfilled since a starting date: the veAERO and veVELO nfts were migrated to the sAERO nfts on 2026-10-22
const stakedVeNftsStartingDates = {
  [CHAIN_TOKEN_ADDRESSES[NetworkIds.base].SAERO]: '2026-10-23',
}

// adds the missing daily points of a staked veNft from its starting date until yesterday, today's point is added with the current values
const getBackfilledEvolution = async (token: Token & { chainId: string }, evolution: any[], utcDateNow: string) => {
  const startingDate = stakedVeNftsStartingDates[token.address];
  if (!token.isStakedVeNft || !startingDate) {
    return evolution;
  }
  const missingDates: string[] = [];
  for (let ts = utcDateStringToTimestamp(startingDate); ts < utcDateStringToTimestamp(utcDateNow); ts += ONE_DAY_MS) {
    const date = timestampToUTC(ts);
    if (!evolution.find(e => e.date === date)) {
      missingDates.push(date);
    }
  }
  if (!missingDates.length) {
    return evolution;
  }
  const veNftIds = token.veNftIds!;
  const contract = new Contract(token.address, VE_NFT_ABI, getProvider(token.chainId));
  const [histoData, votingPowers, utcKeyBlocksCache] = await Promise.all([
    getHistoricalTokenData(token.coingeckoId!, utcDateStringToTimestamp(missingDates[0]) / 1000 - ONE_DAY_SECS, utcDateStringToTimestamp(utcDateNow) / 1000),
    // the voting power of a permanent lock is its staked amount, no archive call needed
    getMulticallOutput(
      missingDates.flatMap(date => veNftIds.map(id => ({ contract, functionName: 'balanceOfNFTAt', params: [id, utcDateStringToTimestamp(date) / 1000] }))),
      Number(token.chainId),
    ),
    getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false),
  ]);
  const histoPrices: [number, number][] = histoData?.prices || [];
  // failed calls are null in the multicall output, the backfill is retried next time instead of saving 0 balances
  if (!histoPrices.length || votingPowers.some((v: BigNumber | null) => !v)) {
    return evolution;
  }
  const newData = missingDates.map((date, i) => {
    const dateTs = utcDateStringToTimestamp(date);
    // the price closest to the start of the day, like the daily snapshots
    const [, price] = histoPrices.reduce((closest, curr) => Math.abs(curr[0] - dateTs) < Math.abs(closest[0] - dateTs) ? curr : closest);
    const balance = votingPowers
      .slice(i * veNftIds.length, (i + 1) * veNftIds.length)
      .reduce((prev: number, curr: BigNumber) => prev + getBnToNumber(curr, token.decimals), 0);
    return { block: utcKeyBlocksCache?.data?.[token.chainId]?.[date] || null, date, balance, price };
  });
  return [...evolution, ...newData].sort((a, b) => a.date < b.date ? -1 : 1);
}

// TODO: refacto historical script part to another file
export default async function handler(req, res) {
  // const { updateChainId, ignoreCache } = req.query;
  const cacheKey = `venfts-evolution-v1.0.5`;
  const cacheDuration = 3600;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, false, cacheDuration);
  try {    
    // if not from cron job, return cached data
    if (req.method !== 'POST' || req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return res.status(200).json(cachedData);
    }

    // if (ignoreCache !== 'true' && isValid) {
    //   res.status(200).send(cachedData);
    //   return
    // }

    const now = Date.now();
    const utcDateNow = timestampToUTC(now);

    const veNfts = [
      // ...Object
      //   .values(CHAIN_TOKENS[NetworkIds.mainnet]).filter(({ veNftId }) => !!veNftId)
      //   .map((lp) => ({ chainId: NetworkIds.mainnet, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.optimism]).filter(isVeNftToken)
        .map((lp) => ({ chainId: NetworkIds.optimism, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.base]).filter(isVeNftToken)
        .map((lp) => ({ chainId: NetworkIds.base, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.bsc]).filter(isVeNftToken)
        .map((lp) => ({ chainId: NetworkIds.bsc, ...lp })),
      ...Object
        .values(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(isVeNftToken)
        .map((lp) => ({ chainId: NetworkIds.arbitrum, ...lp })),
      // ...Object
      //   .values(CHAIN_TOKENS[NetworkIds.polygon]).filter(({ veNftId }) => !!veNftId)
      //   .map((lp) => ({ chainId: NetworkIds.polygon, ...lp })),
      // ...Object
      //   .values(CHAIN_TOKENS[NetworkIds.avalanche]).filter(({ veNftId }) => !!veNftId)
      //   .map((lp) => ({ chainId: NetworkIds.avalanche, ...lp })),

    ];

    // const { data: utcKeyBlockValues } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };

    for (let token of veNfts) {
      const archivedEvolution = cachedData?.veNfts?.find(_t => _t.address === token.address)?.evolution || [];
      // if the backfill fails the daily snapshot still happens, the backfill is retried next time
      token.evolution = await getBackfilledEvolution(token, archivedEvolution, utcDateNow).catch(e => {
        console.error(e);
        return archivedEvolution;
      });

      // if ((!!updateChainId && token.chainId !== updateChainId) || !updateChainId || !utcKeyBlockValues[token.chainId]) {        
      //   continue;
      // }

      // const utcDateBlocks = Object.entries(utcKeyBlockValues[token.chainId]).map(([key, value]) => ({ date: key, block: value }));
      // const archivedDataBlocks = archivedEvolution.map(e => e.block);
      // const blocks = utcDateBlocks.map(d => d.block)
      //   .filter(b => !archivedDataBlocks.includes(b) && (b >= startingBlocks[token.chainId] || !startingBlocks[token.chainId]));

      // if (!blocks.length) {
      //   continue;
      // }

      // const histoPrices = (await getHistoricalTokenData(token.coingeckoId))?.prices || [];
      // if (!histoPrices.length) {
      //   continue;
      // }

      // const contract = new Contract(token.address, VE_NFT_ABI, getHistoricalProvider(token.chainId));
      // const veNftBalances = await Promise.all(
      //   blocks.map(block => {
      //     return getMulticallOutput([
      //       { contract, functionName: 'locked', params: [token.veNftId] },
      //     ], Number(token.chainId), block)
      //   })
      // );

      // const histoPricesAsObj = histoPrices.reduce((acc, [ts, price]) => ({ ...acc, [timestampToUTC(ts)]: price }), {});
      // const newData = blocks.map((block, i) => {
      //   const utcData = utcDateBlocks.find(utc => utc.block === block);
      //   const histoPrice = histoPricesAsObj[utcData.date] || getOrClosest(histoPricesAsObj, utcData.date, 100);
      //   const amount = Array.isArray(veNftBalances[i][0]) ? veNftBalances[i][0][0] : veNftBalances[i][0];
      //   return {
      //     ...utcData,
      //     balance: getBnToNumber(amount, token.decimals),
      //     price: histoPrice,
      //   }
      // });
      // token.evolution = [...archivedEvolution, ...newData];
    }

    // get current values
    const [
      currentValues,
      currentBlocks,
      cgPrices,
    ] = await Promise.all([
      Promise.all(
        veNfts.map(veNft => {
          const contract = new Contract(veNft.address, VE_NFT_ABI, getProvider(veNft.chainId));
          // VotingEscrow v3: amounts are in staked(), the amounts of the veNftIds are summed (in an array like a locked() output)
          if (veNft.isStakedVeNft) {
            return Promise.all(veNft.veNftIds!.map(id => contract.staked(id)))
              .then(stakes => [stakes.reduce((prev, curr) => prev.add(curr.amount), BigNumber.from('0'))]);
          }
          return contract['locked'](veNft.veNftId);
        })
      ),
      Promise.all(
        veNfts.map(veNft => {
          const provider = getProvider(veNft.chainId);
          return provider.getBlockNumber();
        })
      ),
      getCacheFromRedis(cgPricesCacheKey, false),
    ]);

    veNfts.forEach((veNft, i) => {
      const amount = Array.isArray(currentValues[i][0]) ? currentValues[i][0][0] : currentValues[i][0];
      const price = cgPrices[veNft.coingeckoId]?.usd || 0;
      veNft.currentBalance = getBnToNumber(amount, veNft.decimals);
      veNft.currentUtcDate = utcDateNow;
      veNft.currentPrice = price;
      veNft.currentBlock = currentBlocks[i];
      if (price && !veNft.evolution.find(e => e.date === utcDateNow)) {
        veNft.evolution.push({ block: currentBlocks[i], date: utcDateNow, balance: veNft.currentBalance, price: veNft.currentPrice });
      }
    });

    const results = {
      timestamp: now,
      veNfts,
    };

    await redisSetWithTimestamp(cacheKey, results);    
    
    return res.status(200).send(results);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      if (cachedData) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cachedData);
      } else {
        res.status(500).send({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).send({ success: false });
    }
  }
}