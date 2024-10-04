import { Contract } from 'ethers'
import 'source-map-support'
import { INV_ABI, XINV_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { throttledPromises } from '@app/util/misc';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { addBlockTimestamps } from '@app/util/timestamps';

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

const VESTERS = [
  "0x60f491CEF0602eaC0b485e6551eeE2eFee934546",
  "0x5D4bd975b8eB5A0AA8bEDf765929DB98cA6A44a1",
  "0xcc2CFcDf943C89718020BFC612CA06a2B3A83005",
  "0xDA37E0458f3828C0073F40B2CEBD8084e978d4BA",
  "0xB422De4b9707E0a209695c96CCbBF6F53d36dF96",
  "0x703b74Af27d80bb3828Cdb0Aa4a9bed26b98D438",
  "0x52306b083CDDa14621160A560eF7d0309286748C",
  "0x38843a25edCc739C8600E2AD6C0caF6b03cc58f5",
  "0x90b7A0B834c830Aca8Cb9561A33e8C59E1248634",
  "0x849e21c3FB182D3D359595B0097b4AA249c16366",
  "0x4fE3c4Ed897171b3E25F360D731697780985e7C4",
  "0xe6490Cb091a83a33BFd8a1227De4D7cb229C4462",
  "0x5D69A16e0455225C9c885Eb1c008e9A08dD4CC44",
  "0x7E1F028E420428B92936DFf0F6bc4E4b5e7954C5",
  "0x8b7Ec29b5a2eC3f3f3551A0E34c92E41662006A3",
  "0x2A7EDcC9bC207013d361cb1c07AcAF7500364574",
  "0xdE669A42f661Acd1B798374F4B481Aa259A9eAaD",
  "0x52f052503d38a61eE7ED3C09415902583146b114",
  // season 2
  "0xcE7B8e370f5e71aA7EAA7c43D9fAb7EA66Dd39c1",
  "0x56e71BB6a1b749Ec761c2A9Ba0835aCaF7DfcA1A",
  "0xeF591dfD7f59be332cF2Ba1929568aaA8D990512",
  "0xfc2dd0f4F2dfBE70f268453305E201f7b353B0E6",
  "0xD187c80F0048618335B66c9674451606E6A17816",
  "0x9dCBC80D56e78456aEFe107E7339ffef2523ffaB",
  "0x0f9F33Ec2D77DdAd58abaf98d4F576be025CbA05",
  "0xf3BD53EEAAe32F5C09329d8d689131B8E3432101",
];

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
    const excludedBalances = batchedData.map(b => b[2].map((bn) => getBnToNumber(bn)));

    const vestersData = await throttledPromises(
      (block: number) => {
        // TODO: find a better way to get the number of vesters
        const isAfterNewestVester = block >= 16809953;
        const vesters = isAfterNewestVester ? VESTERS.concat('0x33C8E387F3fA2E37C0670bC111f8866Fa79889d7') : VESTERS;
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
      const totalInvExcluded = vestersData[i]
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