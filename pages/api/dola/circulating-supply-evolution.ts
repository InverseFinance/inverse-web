import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { BigNumber } from 'ethers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { getOrClosest, mergeDeep, throttledPromises, timestampToUTC } from '@app/util/misc';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { addBlockTimestamps, getRedisCachedOnlyBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';

const {
  DOLA,
  FEDS,
  F2_MARKETS,
} = getNetworkConfigConstants();

const CHAIN_START_BLOCKS = {
  [NetworkIds.mainnet]: 16155758,
  [NetworkIds.optimism]: 61968205,
  [NetworkIds.arbitrum]: 125683283,
  [NetworkIds.base]: 3694545,
}

const FARMER_START_BLOCKS = {
  // velo v1
  '0xFED67cC40E9C5934F157221169d772B328cb138E': 61968205,
  // velo v2
  '0x11ec78492d53c9276dd7a184b1dbfb34e50b710d': 106057249,
  // arb farmer
  '0x1992af61fbf8ee38741bcc57d636caa22a1a7702': 125683283,
  // base farmer
  '0x2457937668a345305FE08736F407Fba3F39cbF2f': 3694545,
}
const FARMER_END_BLOCKS = {
  // velo v1
  '0xFED67cC40E9C5934F157221169d772B328cb138E': 106217226,
}
const XCHAIN_DAYS_INTERVAL = 7;
const CHAIN_BLOCKS_INTERVALS = {
  [NetworkIds.optimism]: 1 / 2 * 86400 * XCHAIN_DAYS_INTERVAL,
  [NetworkIds.base]: 1 / 2 * 86400 * XCHAIN_DAYS_INTERVAL,
  [NetworkIds.arbitrum]: 1 / 0.3 * 86400 * XCHAIN_DAYS_INTERVAL,
}

const FARMERS = FEDS.filter(fed => !!fed.incomeChainId && !!fed.incomeSrcAd)
  .map(fed => {
    return [[fed.incomeSrcAd, fed.incomeChainId]].concat(fed.oldIncomeSrcAds ? fed.oldIncomeSrcAds.map(ad => [ad, fed.incomeChainId]) : []);
  })
  .flat()
  .map(fedData => {
    return [fedData[0], fedData[1]];
  });

const FARMERS_CHAIN_IDS = [...new Set(FARMERS.map(f => f[1]))];

const mainnetExcluded = [
  // AN_DOLA
  '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
  ...F2_MARKETS.map(m => [m.address, m.startingBlock]),
];

const XCHAIN_TIMESTAMPS_CACHE_KEY = 'xchain-block-timestamps-unarchived';

const getXchainTimestamps = async () => {
  for (let chainId of FARMERS_CHAIN_IDS) {
    const startingBlock = CHAIN_START_BLOCKS[chainId];
    const provider = getProvider(chainId, chainId === NetworkIds.optimism ? process.env.OP_ALCHEMY_KEY : undefined, chainId === NetworkIds.optimism);
    const currentBlock = await provider.getBlockNumber();
    const intIncrement = Math.floor(CHAIN_BLOCKS_INTERVALS[chainId]);
    const nbIntervals = (currentBlock - startingBlock) / intIncrement;
    const nbDays = nbIntervals / XCHAIN_DAYS_INTERVAL;
    const blocks = Array.from({ length: Math.ceil(nbIntervals) }, (_, i) => startingBlock + i * intIncrement).filter(b => b < (currentBlock));
    if (nbDays >= 0.8) {
      blocks.push(currentBlock);
    }
    await addBlockTimestamps(
      blocks,
      chainId,
      XCHAIN_TIMESTAMPS_CACHE_KEY,
    );
  }
}

export default async function handler(req, res) {
  const cacheKey = `dola-circ-supply-evolution-v1.0.1`;

  try {
    const cacheDuration = 40000;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration);

    const dolaContract = new Contract(DOLA, DOLA_ABI, getProvider(NetworkIds.mainnet));

    if (isValid) {
      res.status(200).send(data);
      return
    }
    await getXchainTimestamps();

    const [mainnetCachedTimestamps, xchainCachedTimestamps] = await Promise.all([
      getRedisCachedOnlyBlockTimestamps(),
      getRedisCachedOnlyBlockTimestamps(XCHAIN_TIMESTAMPS_CACHE_KEY),
    ]);
    
    const cachedTimestamps = mergeDeep(mainnetCachedTimestamps, xchainCachedTimestamps);
    // per chain, map an utc date with a blockNumber
    const utcKeyBlockValues = {};
    const blockKeyUtcValue = {};

    [NetworkIds.mainnet, ...FARMERS_CHAIN_IDS].forEach(chainId => {
      if (!utcKeyBlockValues[chainId]) utcKeyBlockValues[chainId] = {};
      if (!blockKeyUtcValue[chainId]) blockKeyUtcValue[chainId] = {};
      Object.entries(cachedTimestamps[chainId]).forEach(([block, ts]) => {
        const utcDate = timestampToUTC(ts * 1000);
        utcKeyBlockValues[chainId][utcDate] = block;
        blockKeyUtcValue[chainId][block] = utcDate;
      });
    });

    await redisSetWithTimestamp('utc-dates-blocks', utcKeyBlockValues);

    const chainBalances = {};
    const lastUtcDate = cachedData?.lastUtcDate || '2022-12-10';

    const mainnetBlocks = Object.entries(utcKeyBlockValues[CHAIN_ID])
      .filter(([utcDate, blockForUtc]) => utcDate > lastUtcDate)
      .map(([utcDate, blockForUtc]) => blockForUtc)
      .map(v => parseInt(v))
      .filter(v => v >= CHAIN_START_BLOCKS[CHAIN_ID]);

    if(!mainnetBlocks?.length) {
      res.status(200).send(cachedData);
      return; 
    }

    for (let chainId of FARMERS_CHAIN_IDS) {
      const chainFarmers = FARMERS.filter(f => f[1] === chainId);
      const chainDola = getToken(CHAIN_TOKENS[chainId], 'DOLA');
      const chainProvider = getProvider(chainId, chainId === NetworkIds.optimism ? process.env.OP_ALCHEMY_KEY : undefined, chainId === NetworkIds.optimism);
      const chainDolaContract = new Contract(chainDola.address!, DOLA_ABI, chainProvider);      
      // only get blocks after lastUtcDate
      const chainBlocks =
        Object.entries(utcKeyBlockValues[chainId])
          .filter(([utcDate, blockForUtc]) => utcDate > lastUtcDate)
          .map(([utcDate, blockForUtc]) => blockForUtc)
          .map(v => parseInt(v))
          .filter(v => v >= CHAIN_START_BLOCKS[chainId]);
      chainBlocks.sort((a, b) => a - b);

      const balances = await throttledPromises(
        (block: number) => {
          return getGroupedMulticallOutputs([
            chainFarmers.map(excludedData => {
              const farmerAd = excludedData[0];
              return {
                contract: chainDolaContract,
                functionName: 'balanceOf',
                params: [farmerAd],
                // 0 value if before startingBlock
                forceFallback: FARMER_START_BLOCKS[farmerAd] > block || (!!FARMER_END_BLOCKS[farmerAd] && FARMER_END_BLOCKS[farmerAd] <= block),
                fallbackValue: BigNumber.from('0'),
              }
            }),
          ],
            Number(chainId),
            block,
          );
        },
        chainBlocks,
        5,
        100,
      );

      const totalBalancesPerBlock = balances.map(blockFarmerBalances => blockFarmerBalances.flat().map(v => getBnToNumber(v)).reduce((prev, curr) => prev + curr, 0))
      chainBalances[chainId] = {
        balancesOnUtcDate: chainBlocks.map((block, i) => blockKeyUtcValue[chainId][block]),
        blocks: chainBlocks,
        balances: totalBalancesPerBlock,
        asUtcObj: chainBlocks.reduce((prev, curr, i) => ({ ...prev, [blockKeyUtcValue[chainId][curr]]: totalBalancesPerBlock[i] }), {}),
      };
    }

    // on mainnet, get totalSupply and balances in markets
    const mainnetData = await throttledPromises(
      (block: number) => {
        return getGroupedMulticallOutputs([
          { contract: dolaContract, functionName: 'totalSupply' },
          mainnetExcluded.map(excludedData => {
            // if excludedData is an array we have a startingBlock
            return {
              contract: dolaContract,
              functionName: 'balanceOf',
              params: [Array.isArray(excludedData) ? excludedData[0] : excludedData],
              // 0 value if before startingBlock
              forceFallback: Array.isArray(excludedData) ? excludedData[1] > block : false,
              fallbackValue: BigNumber.from('0'),
            }
          }),
        ],
          Number(CHAIN_ID),
          block,
        );
      },
      mainnetBlocks,
      5,
      100,
    );
    
    const newEvolutionData = mainnetData.map((dataAtBlock, i) => {
      const [totalSupplyBn, balances] = dataAtBlock;
      const mainnetExcluded = balances.reduce((prev, curr) => getBnToNumber(curr) + prev, 0);
      const totalSupply = getBnToNumber(totalSupplyBn);
      const utcDate = blockKeyUtcValue[CHAIN_ID][mainnetBlocks[i]];
      const farmersExcluded = FARMERS_CHAIN_IDS.map(chainId => {
        return getOrClosest(chainBalances[chainId].asUtcObj, utcDate) || 0;
      }).reduce((prev, curr) => prev + curr, 0);
      const circSupply = totalSupply - mainnetExcluded - farmersExcluded;
      return {
        utcDate,
        totalSupply,
        circSupply,
        mainnetExcluded,
        farmersExcluded,
      }
    });
    
    const newLastUtcDate = newEvolutionData[newEvolutionData.length - 1].lastUtcDate;

    const results = {
      timestamp: Date.now(),
      lastUtcDate: newLastUtcDate,
      evolution: cachedData ? cachedData.evolution.concat(newEvolutionData) : newEvolutionData,
    }
    // await redisSetWithTimestamp(cacheKey, results);
    return res.status(200).send(results);
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
      res.status(500);
    }
  }
}