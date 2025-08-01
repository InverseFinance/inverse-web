import { Contract } from 'ethers'
import 'source-map-support'
import { INV_ABI, SINV_ABI, VESTER_FACTORY_ABI, XINV_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID, SINV_ADDRESS } from '@app/config/constants';
import { throttledPromises } from '@app/util/misc';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { addBlockTimestamps } from '@app/util/timestamps';
import { OTC_ADDRESS } from '@app/pages/otc';
import { parseEther } from '@ethersproject/units';

const {
  TREASURY,
  XINV_VESTOR_FACTORY,
  POLICY_COMMITTEE,
} = getNetworkConfigConstants();

const excluded = [
  TREASURY,
  POLICY_COMMITTEE,
  // Stacking ETH INV LP
  '0x5c1245F9dB3f8f7Fe1208cB82325eA88fC11Fe89',
];

const vestersToCheck = [...Array(45).keys()];

export default async function handler(req, res) {
  const cacheKey = `inv-circ-supply-evolution-v1.0.3`;

  try {
    const cacheDuration = 10000;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration);

    if (isValid) {
      res.status(200).send(cachedData);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const currentBlock = await provider.getBlockNumber();
    const contract = new Contract(process.env.NEXT_PUBLIC_REWARD_TOKEN!, INV_ABI, provider);
    const xinvContract = new Contract(process.env.NEXT_PUBLIC_REWARD_STAKED_TOKEN!, XINV_ABI, provider);
    const sinvContract = new Contract(SINV_ADDRESS, SINV_ABI, provider);

    const archived = cachedData || { blocks: [], timestampsSec: [], evolution: [] };
    const lastArchivedBlock = archived.blocks.length > 0 ? archived.blocks[archived.blocks.length - 1] : 16155758;

    const startingBlock = lastArchivedBlock + 1 < currentBlock ? lastArchivedBlock + 1 : currentBlock;

    const intIncrement = Math.floor(BLOCKS_PER_DAY);
    const nbDays = (currentBlock - startingBlock) / intIncrement;
    const blocks = Array.from({ length: Math.ceil(nbDays) }, (_, i) => startingBlock + i * intIncrement).filter(b => b < (currentBlock));
    if(nbDays > 0.25) {
      blocks.push(currentBlock);
    }

    const cachedTimestamps = await addBlockTimestamps(
      blocks,
      '1',
    );    

    const batchedData = await throttledPromises(
      (block: number) => {
        return getGroupedMulticallOutputs([
          { contract: xinvContract, functionName: 'exchangeRateStored' },
          { contract: contract, functionName: 'totalSupply' },
          { contract: sinvContract, functionName: 'balanceOf', params: [OTC_ADDRESS] },
          { contract: sinvContract, functionName: 'convertToAssets', params: [parseEther('1')] },
          excluded.map(excludedAd => ({ contract, functionName: 'balanceOf', params: [excludedAd] })),
        ],
          Number(CHAIN_ID),
          block,
        );
      },
      blocks,
      5,
      100,
    );

    const exRates = batchedData.map(b => getBnToNumber(b[0]));
    const totalSupplies = batchedData.map(b => getBnToNumber(b[1]));
    const sinvLockedBalances = batchedData.map(b => getBnToNumber(b[2]));
    const invLockedBalances = sinvLockedBalances.map((slb,i) => slb * getBnToNumber(batchedData[i][3]));
    const excludedBalances = batchedData.map(b => b[4].map((bn) => getBnToNumber(bn)));

    const vesterFactory = new Contract(XINV_VESTOR_FACTORY, VESTER_FACTORY_ABI, provider);
    const vestersResults = await Promise.allSettled([
      ...vestersToCheck.map((v, i) => vesterFactory.vesters(i))
    ]);
  
    const vesters = vestersResults ? vestersResults.filter(r => r.status === 'fulfilled').map(r => r.value) : [];

    const vestersData = await throttledPromises(
      (block: number) => { 
        return getGroupedMulticallOutputs(
          vesters.map(excludedAd => ({ contract: xinvContract, functionName: 'balanceOf', params: [excludedAd] })),
          Number(CHAIN_ID),
          block,
        );
      },
      blocks,
      5,
      100,
    );

    const evolution = blocks.map((block, i) => {
      const totalInvExcluded = invLockedBalances[i] + vestersData[i]
        .map(bn => getBnToNumber(bn) * exRates[i])
        .concat(
          excludedBalances[i]
        )
        .reduce((prev, curr) => prev + curr, 0);

      const circulatingSupply = totalSupplies[i] - totalInvExcluded;
      return circulatingSupply;
    });

    const timestampsSec = blocks.map(b => cachedTimestamps[CHAIN_ID][b]);

    const result = {
      timestamp: Date.now(),
      blocks: archived.blocks.concat(blocks),
      timestampsSec: archived.timestampsSec.concat(timestampsSec),
      evolution: archived.evolution.concat(evolution),
    }

    await redisSetWithTimestamp(cacheKey, result);

    res.status(200).send(result);
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