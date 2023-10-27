import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI, INV_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { BigNumber } from 'ethers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { throttledPromises, timestampToUTC } from '@app/util/misc';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';

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

const farmers = FEDS.filter(fed => !!fed.incomeChainId && !!fed.incomeSrcAd)
  .map(fed => {
    return [[fed.incomeSrcAd, fed.incomeChainId]].concat(fed.oldIncomeSrcAds ? fed.oldIncomeSrcAds.map(ad => [ad, fed.incomeChainId]) : [[]]);
  })
  .flat()
  .map(fed => {
    return [fed[0], fed[1]];
  });

const mainnetExcluded = [
  // AN_DOLA
  '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
  // ...farmers,
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
    await getXchainTimestamps()    

    const cachedTimestamps = await getCachedBlockTimestamps();
    // per chain, map an utc date with a blockNumber
    const utcBlockValues = {};
    const blockUtcValues = {};

    [NetworkIds.mainnet, NetworkIds.arbitrum, NetworkIds.base, NetworkIds.optimism].forEach(chainId => {
      if (!utcBlockValues[chainId]) utcBlockValues[chainId] = {};
      if (!blockUtcValues[chainId]) blockUtcValues[chainId] = {};
      Object.entries(cachedTimestamps[chainId]).forEach(([bn, ts]) => {
        const utcDate = timestampToUTC(ts * 1000);
        utcBlockValues[chainId][utcDate] = bn;
        blockUtcValues[chainId][bn] = utcDate;
      });
    });

    const mainnetBlocks = Object.keys(utcBlockValues[CHAIN_ID])
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

    const mainnetEvolution = mainnetData.map((dataAtBlock, i) => {
      const [totalSupplyBn, balances] = dataAtBlock;      
      const excluded = balances.reduce((prev, curr) => getBnToNumber(curr) + prev, 0);
      const totalSupply = getBnToNumber(totalSupplyBn);
      const circSupply = totalSupply - excluded;
      return {
        utcDate: blockUtcValues[CHAIN_ID][mainnetBlocks[i]],
        totalSupply,
        circSupply,
        excluded,
        block: mainnetBlocks[i],
      }
    });

    return res.status(200).send({ mainnetEvolution });
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