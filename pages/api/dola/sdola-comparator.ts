import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getAaveV3RateOf } from '@app/util/borrow-rates-comp';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber, getDefiLlamaApy, getSavingsCrvUsdData, getSavingsdeUSDData, getSavingsUSDData, getSUSDEData, getYearnVaultApy } from '@app/util/markets';
import { getDSRData } from '@app/util/markets';
import { TOKEN_IMAGES } from '@app/variables/images';
import { timestampToUTC } from '@app/util/misc';
import { BigNumber, Contract } from 'ethers';
import { SVAULT_ABI } from '@app/config/abis';
import { getMulticallOutput } from '@app/util/multicall';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { ONE_DAY_SECS } from '@app/config/constants';

// https://vision.perspective.fi/api/mainnet/graph-data/0xb45ad160634c528Cc3D2926d9807104FA3157305

const VAULT_ABI_EXTENDED = [
  ...SVAULT_ABI,
  "function convertToUnderlyingToken(uint) view returns (uint)",
]

export const getOnChainData = async (meta: any[]) => {
  const { data: utcKeyBlockValues, isValid } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };
  const provider = getProvider(NetworkIds.mainnet);
  const currentBlockNumber = await provider.getBlockNumber();
  const currentBlock = await provider.getBlock(currentBlockNumber);
  const currentBlockTimestamp = currentBlock.timestamp;
  const previousBlock = await provider.getBlock(`0x${(currentBlockNumber - 1).toString(16)}`);
  const previousBlockTimestamp = previousBlock.timestamp;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const thirtyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 30 * dayMs)];
  const sixtyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 60 * dayMs)];
  const ninetyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 90 * dayMs)];
  const oneHundredEightyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 180 * dayMs)];
  const threeHundredSixtyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 365 * dayMs)];
  const blocks = [currentBlockNumber, previousBlock.number, thirtyDaysAgoBlock, sixtyDaysAgoBlock, ninetyDaysAgoBlock, oneHundredEightyDaysAgoBlock, threeHundredSixtyDaysAgoBlock];

  const [todayRates, previousBlockRates, thirtyDayRates, sixtyDayRates, ninetyDayRates, oneHundredEightyDayRates, threeHundredSixtyDayRates] = await Promise.all(
    blocks.map(block => getMulticallOutput(
      meta.map(metaItem => ({
        contract: new Contract(metaItem.address, VAULT_ABI_EXTENDED, provider),
        functionName: metaItem.convertMethod || 'convertToAssets',
        params: ['1000000000000000000'],
        forceFallback: metaItem.isNotVault,
        fallbackValue: BigNumber.from('0'),
      })),
      1,
      block,
    ))
  );

  const [todayAssets, thirtyDaysAgoAssets, ninetyDayAssets] = await Promise.all(
    [currentBlockNumber, thirtyDaysAgoBlock, ninetyDaysAgoBlock].map(block => getMulticallOutput(
      meta.map(metaItem => ({
        contract: new Contract(metaItem.address, VAULT_ABI_EXTENDED, provider),
        functionName: metaItem.totalMethod || 'totalAssets',
        forceFallback: metaItem.isNotVault,
        fallbackValue: BigNumber.from('0'),
      })),
      1,
      block,
    ))
  );

  const [decimals] = await Promise.all(
    [currentBlockNumber].map(block => getMulticallOutput(
      meta.map(metaItem => ({
        contract: new Contract(metaItem.address, VAULT_ABI_EXTENDED, provider),
        functionName: 'decimals',
        forceFallback: metaItem.isNotVault,
        fallbackValue: BigNumber.from('18'),
      })),
      1,
      block,
    ))
  );

  const nonVaultHistoricalRates = await Promise.all(
    meta.map(m => m.isNotVault && m.pool ? getDefiLlamaApy(m.pool) : null)
  );

  return meta.map((metaItem, index) => {
    if (metaItem.isNotVault) {
      if (nonVaultHistoricalRates[index]) {
        return nonVaultHistoricalRates[index];
      }
      return {
        calculatedApy: 0, apy30d: 0, apy60d: 0, apy90d: 0, apy180d: 0, apy365d: 0, totalAssets: 0, totalAssets30d: 0, totalAssets90d: 0,
      }
    }
    const todayExRate = getBnToNumber(todayRates[index]);
    const calculatedApy = 100 * (Math.pow(todayExRate / getBnToNumber(previousBlockRates[index]), (365 * ONE_DAY_SECS) / (currentBlockTimestamp - previousBlockTimestamp)) - 1);
    const apy30d = 100 * (Math.pow(todayExRate / getBnToNumber(thirtyDayRates[index]), 365 / 30) - 1);
    const apy60d = 100 * (Math.pow(todayExRate / getBnToNumber(sixtyDayRates[index]), 365 / 60) - 1);
    const apy90d = 100 * (Math.pow(todayExRate / getBnToNumber(ninetyDayRates[index]), 365 / 90) - 1);
    const apy180d = 100 * (Math.pow(todayExRate / getBnToNumber(oneHundredEightyDayRates[index]), 365 / 180) - 1);
    const apy365d = 100 * (Math.pow(todayExRate / getBnToNumber(threeHundredSixtyDayRates[index]), 1) - 1);
    return {
      calculatedApy,
      apy30d,
      apy60d,
      apy90d,
      apy180d,
      apy365d,
      totalAssets: getBnToNumber(todayAssets[index], getBnToNumber(decimals[index], 0)),
      totalAssets30d: getBnToNumber(thirtyDaysAgoAssets[index], getBnToNumber(decimals[index], 0)),
      totalAssets90d: getBnToNumber(ninetyDayAssets[index], getBnToNumber(decimals[index], 0)),
    }
  });
}

const getDefillamaData = async (poolIds: string[]) => {
  const url = `https://yields.llama.fi/pools`;
  try {
    const results = await fetch(url);
    const data = await results.json();
    const pools = data.status === 'success' ? data.data : [];
    return pools
      .filter(p => poolIds.includes(p.pool))
  } catch (e) { console.log(e) }
  return {};
}

export default async function handler(req, res) {
  const cacheKey = `sdola-rates-compare-v1.1.3`;

  try {
    const cacheDuration = 120;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
    res.setHeader('Access-Control-Allow-Origin', `*`);
    res.setHeader('Access-Control-Allow-Methods', `GET`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration);

    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const meta = [
      {
        symbol: 'USDC',
        project: 'Aave-V3',
        link: 'https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3',
        pool: 'aa70268e-4b52-42bf-a116-608b370f9501',
        address: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
        underlying: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        zapSymbol: 'aEthUSDC',
        isNotVault: true,
        currentRateGetter: () => getAaveV3RateOf(provider, 'USDC'),
      },
      {
        symbol: 'USDT',
        project: 'Aave-V3',
        link: 'https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3',
        pool: 'f981a304-bb6c-45b8-b0c5-fd2f515ad23a',
        address: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a',
        underlying: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        zapSymbol: 'aEthUSDT',
        isNotVault: true,
        currentRateGetter: () => getAaveV3RateOf(provider, 'USDT'),
      },
      {
        symbol: 'sDAI',
        project: 'Spark',
        link: 'https://app.spark.fi/',
        pool: '0b8fec3b-a715-4803-94ce-9fe3b7520b23',
        address: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
        underlying: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        currentRateGetter: () => getDSRData(),
      },
      {
        symbol: 'sfrxUSD',
        project: 'Frax',
        link: 'https://frax.com/earn',
        pool: '42523cca-14b0-44f6-95fb-4781069520a5',
        address: '0xcf62F905562626CfcDD2261162a51fd02Fc9c5b6',
        underlying: '0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29',
        currentRateGetter: () => getDefiLlamaApy("42523cca-14b0-44f6-95fb-4781069520a5"),
      },
      {
        symbol: 'sUSDe',
        project: 'Ethena',
        link: 'https://app.ethena.fi/earn',
        pool: '66985a81-9c51-46ca-9977-42b4fe7bc6df',
        address: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
        underlying: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
        currentRateGetter: () => getSUSDEData(provider, true),
      },
      {
        symbol: 'sDOLA',
        project: 'FiRM',
        link: 'https://inverse.finance/sDOLA',
        pool: 'bf0f95c9-bc46-467d-9762-1d80ff50cd74',
        address: '0xb45ad160634c528Cc3D2926d9807104FA3157305',
        underlying: '0x865377367054516e17014CcdED1e7d814EDC9ce4',
        currentRateGetter: () => fetch('https://www.inverse.finance/api/dola-staking').then(res => res.json()),
      },
      {
        symbol: 'scrvUSD',
        project: 'Curve',
        link: 'https://crvusd.curve.fi/#/ethereum/scrvUSD',
        pool: '5fd328af-4203-471b-bd16-1705c726d926',
        address: '0x0655977FEb2f289A4aB78af67BAB0d17aAb84367',
        underlying: '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E',
        currentRateGetter: () => getSavingsCrvUsdData(),
      },
      {
        symbol: 'sUSDS',
        project: 'Sky',
        link: 'https://sky.money',
        pool: 'd8c4eff5-c8a9-46fc-a888-057c4c668e72',
        address: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
        underlying: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
        currentRateGetter: () => getSavingsUSDData(),
      },
      {
        symbol: 'sdeUSD',
        project: 'Elixir',
        link: 'https://elixir.xyz',
        address: '0x5C5b196aBE0d54485975D1Ec29617D42D9198326',
        underlying: '0x15700B564Ca08D9439C58cA5053166E8317aa138',
        currentRateGetter: () => getSavingsdeUSDData(),
      },
      // {
      //   symbol: 'wUSDM',
      //   project: 'Mountain-Protocol',
      //   link: 'https://defi.mountainprotocol.com/wrap',
      // },
      {
        symbol: 'ysUSDS',
        project: 'Yearn',
        link: 'https://yearn.fi/v3/1/0x4cE9c93513DfF543Bc392870d57dF8C04e89Ba0a',
        pool: '2b0d6d34-a4f0-4e53-8fd6-a3ef552b4b21',
        address: '0x4cE9c93513DfF543Bc392870d57dF8C04e89Ba0a',
        underlying: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
        currentRateGetter: () => getYearnVaultApy('0x4cE9c93513DfF543Bc392870d57dF8C04e89Ba0a'),
        image: TOKEN_IMAGES['sUSDS'],
      },
      {
        symbol: 'stUSD',
        project: 'Angle',
        link: 'https://app.angle.money/savings/usd',
        pool: '01e33a85-8bb6-4f30-a11b-7b2a8166e6b7',
        address: '0x0022228a2cc5E7eF0274A7Baa600d44da5aB5776',
        underlying: '0x0000206329b97DB379d5E1Bf586BbDB969C63274',
        currentRateGetter: async () => {
          try {
            const res = await fetch(`https://exporter.angle.money/v2/savings`);
            const data = await res.json();
            return { apy: data.USDA["1"].apr * 100 };
          } catch (e) {
            console.log(e)
          }
          return { apy: 0 };
        },
      },
      {
        symbol: 'stUSR',
        project: 'Resolv',
        link: 'https://app.resolv.xyz/buy/stake',
        pool: '0aedb3f6-9298-49de-8bb0-2f611a4df784',
        address: '0x6c8984bc7DBBeDAf4F6b2FD766f16eBB7d10AAb4',
        underlying: '0x66a1E37c9b0eAddca17d3662D6c05F4DECf3e110',
        zapAddress: '0x1202F5C7b4B9E47a1A484E8B270be34dbbC75055',
        zapSymbol: 'wstUSR',
        currentRateGetter: () => getDefiLlamaApy("0aedb3f6-9298-49de-8bb0-2f611a4df784"),
        convertMethod: 'convertToUnderlyingToken',
        totalMethod: 'totalSupply',
        image: 'https://token-icons.llamao.fi/icons/tokens/1/0x1202f5c7b4b9e47a1a484e8b270be34dbbc75055?h=64&w=64',
      },
      {
        symbol: 'fxSAVE',
        project: 'Fx-protocol',
        link: 'https://fx.aladdin.club/v2/fxsave',
        pool: 'ee0b7069-f8f3-4aa2-a415-728f13e6cc3d',
        address: '0x7743e50F534a7f9F1791DdE7dCD89F7783Eefc39',
        underlying: '0x65C9A641afCEB9C0E6034e558A319488FA0FA3be',
        currentRateGetter: () => getDefiLlamaApy("ee0b7069-f8f3-4aa2-a415-728f13e6cc3d"),
        image: 'https://raw.githubusercontent.com/AladdinDAO/aladdin-assets/refs/heads/main/images/branding/fxSave.png',
      },
    ];

    const [currentRates, defillamaData] = await Promise.all(
      [
        Promise.all(
          meta.map(m => m.currentRateGetter())
        ),
        getDefillamaData(meta.filter(m => !!m.pool).map(m => m.pool)),
      ]
    );

    const onChainData = await getOnChainData(meta);

    const now = Date.now();
    const nowDayUTC = timestampToUTC(now);
    let utcSnapshots = cachedData?.utcSnapshots || [];
    let pastRates = cachedData?.pastRates || [];

    const addTodayRate = !utcSnapshots.includes(nowDayUTC);

    if (addTodayRate) {
      utcSnapshots.push(nowDayUTC);
      pastRates.push({});
    }

    const sortedRates = currentRates
      .map((rate, index) => {
        const metaData = meta[index];
        const symbol = metaData.symbol;
        const pastRatesLen = pastRates.length;
        if (addTodayRate) {
          pastRates[pastRatesLen - 1][symbol] = rate.apy;
        }
        const last30 = pastRates.slice(pastRatesLen - 30, pastRatesLen).filter(pr => !!pr[symbol]);
        const last60 = pastRates.slice(pastRatesLen - 60, pastRatesLen).filter(pr => !!pr[symbol]);
        const last90 = pastRates.slice(pastRatesLen - 90, pastRatesLen).filter(pr => !!pr[symbol]);
        const last180 = pastRates.slice(pastRatesLen - 180, pastRatesLen).filter(pr => !!pr[symbol]);
        const last365 = pastRates.slice(pastRatesLen - 365, pastRatesLen).filter(pr => !!pr[symbol]);
        const defillamaPoolData = defillamaData.find(p => p.pool === metaData.pool);
        return {
          address: metaData.address,
          isVault: !metaData.isNotVault,
          totalAssets: onChainData[index].totalAssets,
          totalAssets30d: onChainData[index].totalAssets30d,
          totalAssets90d: onChainData[index].totalAssets90d,
          tvl: defillamaPoolData?.tvlUsd || onChainData[index].totalAssets || null,
          apy: (rate.supplyRate || rate.apy || onChainData[index].calculatedApy),
          apy30d: (rate.apyMean30d || rate.apy30d),
          calculatedApy: onChainData[index].calculatedApy,
          avg30: onChainData[index].apy30d || (last30.length >= 30 ? last30.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last30.length : 0),
          avg60: onChainData[index].apy60d || (last60.length >= 60 ? last60.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last60.length : 0),
          avg90: onChainData[index].apy90d || (last90.length >= 90 ? last90.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last90.length : 0),
          avg180: onChainData[index].apy180d || (last180.length >= 180 ? last180.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last180.length : 0),
          avg365: onChainData[index].apy365d || (last365.length >= 365 ? last365.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last365.length : 0),
          symbol,
          image: metaData.image || TOKEN_IMAGES[symbol] || `https://token-icons.llamao.fi/icons/tokens/1/${metaData.address.toLowerCase()}?h=64&w=64`,
          project: metaData.project,
          link: metaData.link,
          pool: metaData.pool || null,
        }
      }).sort((a, b) => {
        return a.apy < b.apy ? 1 : b.apy - a.apy;
      });

    if (utcSnapshots.length > 90) {
      utcSnapshots = utcSnapshots.slice(0, 90);
      pastRates = pastRates.slice(0, 90);
    }

    const result = {
      timestamp: Date.now(),
      historicalRates: onChainData,
      pastRates,
      utcSnapshots,
      rates: sortedRates,
    };

    await redisSetWithTimestamp(cacheKey, result);

    return res.status(200).json(result);

  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch (e) {
      console.error(e);
      return res.status(500);
    }
  }
}
