import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { BigNumber } from 'ethers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { getOrClosest, throttledPromises, timestampToUTC } from '@app/util/misc';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
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
  // OP
  // velo v1
  '0xFED67cC40E9C5934F157221169d772B328cb138E': 61968205,
  // velo v2
  '0x11ec78492d53c9276dd7a184b1dbfb34e50b710d': 106057249,
  // arb farmer
  '0x1992af61fbf8ee38741bcc57d636caa22a1a7702': 125683283,
  // base farmer
  '0x2457937668a345305FE08736F407Fba3F39cbF2f': 3694545,
}

const CHAIN_BLOCKS_PER_DAY = {
  [NetworkIds.mainnet]: BLOCKS_PER_DAY * 30,
  [NetworkIds.optimism]: 1 / 2 * 86400 * 30,
  [NetworkIds.base]: 1 / 2 * 86400 * 30,
  [NetworkIds.arbitrum]: 1 / 0.3 * 86400 * 30,
}

const FARMERS = FEDS.filter(fed => !!fed.incomeChainId && !!fed.incomeSrcAd)
  .map(fed => {
    return [[fed.incomeSrcAd, fed.incomeChainId]].concat(fed.oldIncomeSrcAds ? fed.oldIncomeSrcAds.map(ad => [ad, fed.incomeChainId]) : [[]]);
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

const getXchainTimestamps = async () => {
  const nets = [NetworkIds.base, NetworkIds.optimism, NetworkIds.arbitrum];
  for (let net of nets) {
    const startingBlock = CHAIN_START_BLOCKS[net];
    const provider = getProvider(net);
    const currentBlock = await provider.getBlockNumber();
    const intIncrement = Math.floor(CHAIN_BLOCKS_PER_DAY[net]);
    const nbDays = (currentBlock - startingBlock) / intIncrement;
    const blocks = Array.from({ length: Math.ceil(nbDays) }, (_, i) => startingBlock + i * intIncrement).filter(b => b < (currentBlock));
    await addBlockTimestamps(
      blocks,
      net,
    );
  }
}

export default async function handler(req, res) {
  const cacheKey = `dola-circ-supply-evolution-v1.0.0`;

  try {
    const cacheDuration = 10000;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    const dolaContract = new Contract(DOLA, DOLA_ABI, getProvider(NetworkIds.mainnet));

    // if (validCache) {
    //   res.status(200).send(validCache);
    //   return
    // }
    // await getXchainTimestamps()

    const cachedTimestamps = await getCachedBlockTimestamps();
    // per chain, map an utc date with a blockNumber
    const utcKeyBlockValues = {};
    const blockKeyUtcValue = {};

    [NetworkIds.mainnet, NetworkIds.arbitrum, NetworkIds.base, NetworkIds.optimism].forEach(chainId => {
      if (!utcKeyBlockValues[chainId]) utcKeyBlockValues[chainId] = {};
      if (!blockKeyUtcValue[chainId]) blockKeyUtcValue[chainId] = {};
      Object.entries(cachedTimestamps[chainId]).forEach(([block, ts]) => {
        const utcDate = timestampToUTC(ts * 1000);
        utcKeyBlockValues[chainId][utcDate] = block;
        blockKeyUtcValue[chainId][block] = utcDate;
      });
    });    

    const chainBalances = {};

    for (let chainId of FARMERS_CHAIN_IDS) {
      const chainFarmers = FARMERS.filter(f => f[1] === chainId);
      const chainDola = getToken(CHAIN_TOKENS[chainId], 'DOLA');
      const chainDolaContract = new Contract(chainDola.address!, DOLA_ABI, getProvider(chainId));
      const chainBlocks = Object.values(utcKeyBlockValues[chainId])
        .map(v => parseInt(v))
        .filter(v => v >= CHAIN_START_BLOCKS[chainId]);

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
                forceFallback: FARMER_START_BLOCKS[farmerAd] > block,
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
      const totalBalancesPerBlock = balances.map(blockFarmerBalances => blockFarmerBalances.flat().map(v => getBnToNumber(v)).reduce((prev, curr) => prev+curr, 0))
      chainBalances[chainId] = {
        balancesOnUtcDate: chainBlocks.map((block, i) => blockKeyUtcValue[chainId][block]),
        blocks: chainBlocks,
        balances: totalBalancesPerBlock,
        asUtcObj: chainBlocks.reduce((prev, curr, i) => ({ ...prev, [blockKeyUtcValue[chainId][curr]]: totalBalancesPerBlock[i] }), {}),
      };
    }

    const mainnetBlocks = Object.values(utcKeyBlockValues[CHAIN_ID])
      .map(v => parseInt(v))
      .filter(v => v >= CHAIN_START_BLOCKS[CHAIN_ID]);

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

    const evolution = mainnetData.map((dataAtBlock, i) => {
      const [totalSupplyBn, balances] = dataAtBlock;
      const mainnetExcluded = balances.reduce((prev, curr) => getBnToNumber(curr) + prev, 0);
      const totalSupply = getBnToNumber(totalSupplyBn);      
      const utcDate = blockKeyUtcValue[CHAIN_ID][mainnetBlocks[i]];
      const farmersExcluded = FARMERS_CHAIN_IDS.map(chainId => {
        return getOrClosest(chainBalances[chainId], utcDate)||0;
      }).reduce((prev, curr) => prev + curr, 0);
      const circSupply = totalSupply - mainnetExcluded;
      const circSupplyV2 = circSupply - farmersExcluded;
      return {
        utcDate,
        totalSupply,
        circSupply,
        circSupplyV2,
        mainnetExcluded,
        farmersExcluded,
        block: mainnetBlocks[i],
      }
    });

    return res.status(200).send({ evolution });
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