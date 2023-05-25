import { Contract } from 'ethers'
import 'source-map-support'
import { COMPTROLLER_ABI, CTOKEN_ABI } from '@app/config/abis'
import { getHistoricValue, getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'

import { throttledPromises } from '@app/util/misc';

export default async function handler(req, res) {
  const cacheKey = 'dola-fronier-evo-v1.0.1';
  const { cacheFirst } = req.query;
  try {
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', 3600);
    // if (validCache) {
    //   res.status(200).json(validCache);
    //   return
    // }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider('1', '', true);

    const currentBlock = await provider.getBlockNumber();
    const beforeExploit = 14500000;
    const frontierApril = 14507487;
    const frontierJune = 14973269;
    const anDola = new Contract('0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670', CTOKEN_ABI, provider);
    const comptroller = new Contract('0x4dCf7407AE5C07f8681e1659f626E114A7667339', COMPTROLLER_ABI, provider);

    const addresses = [
      '0xeA0c959BBb7476DDD6cD4204bDee82b790AA1562',
      '0xf508c58ce37ce40a40997C715075172691F92e2D',
      '0xe2e4f2a725e42d0f0ef6291f46c430f963482001',
      '0x86426c098e1ad3d96a62cc267d55c5258ddf686a',
      '0x1991059f78026D50739100d5Eeda2723f8d9DD52',
      '0xE69A81190F3A3a388E2b9e1C1075664252A8Ea7C',
      '0x0e81F7af4698Cfe49cF5099A7D1e3E4421D5d1AF',
      '0x6B92686c40747C85809a6772D0eda8e22a77C60c',
    ];

    const keyBlocks = [
      beforeExploit, 
      frontierApril,
      frontierApril + 20000,
      frontierJune - 20000,
      frontierJune,
      frontierJune + 20000,      
      17222401,
      currentBlock,
    ];
    
    const pastBlocksWithRepayments = [14886483, 14886603, 14886680, 15278636, 15304098, 15304239, 15360848, 15360983, 15411675, 15434086, 15455493, 15504354, 15523438, 15703232, 15754266, 15804221, 15861339, 15898338, 15964751, 16020070, 16062753, 16100422, 16155908, 16225516, 16255506, 16356099, 16400813, 16450731, 16513271, 16573456, 16600845, 16667073, 16700672, 16749886, 16814062, 16856037, 16943231, 16955050, 17095914, 17161765];
    const blocks = keyBlocks.concat(pastBlocksWithRepayments).sort((a, b) => a - b);

    const newDebtsBn =
      await throttledPromises(
        (address: string) => {
          return Promise.all(
            blocks.map(block => {
              return getHistoricValue(anDola, block, 'borrowBalanceStored', [address]);
            })
          )
        },
        addresses,
        5,
        100,
      );

    console.log('ended 1')

    const dolaDebts = newDebtsBn.map((userDebts, i) => {
      return userDebts.map((d, i) => {
        return getBnToNumber(anDola.interface.decodeFunctionResult('borrowBalanceStored', d)[0]);
      })
    });
    console.log('ready 2')
    const accountLiqs =
      await throttledPromises(
        (address: string) => {
          return Promise.all(
            blocks.map(block => {
              return getHistoricValue(comptroller, block, 'getAccountLiquidity', [address]);
            })
          )
        },
        addresses,
        5,
        100,
      );

    console.log('ended 2')

    const shortfalls = accountLiqs.map((accountLiq, i) => {
      return accountLiq.map((d, i) => {
        return getBnToNumber(comptroller.interface.decodeFunctionResult('getAccountLiquidity', d)[2]);
      })
    });

    const userBadDebts = dolaDebts.map((userDebts, i) => {
      return userDebts.map((debt, j) => {
        return shortfalls[i][j] > 0 ? debt : 0;
      });
    });

    const resultData = {
      totals: blocks.map((a, i) => addresses.reduce((prev, curr) => prev + userBadDebts[addresses.indexOf(curr)][i], 0)),
      shortfalls,
      dolaDebts,
      userBadDebts,
      blocks,
      timestamp: +(new Date()),
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
        res.status(500).json({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}