import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { CTOKEN_ABI } from '@app/config/abis'
import { getNetwork, getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Token } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_TOKENS, CHAIN_TOKEN_ADDRESSES } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { fetchZerionWithRetry } from '@app/util/zerion';

const formatBn = (bn: BigNumber, token: Token) => {
  return { token, balance: getBnToNumber(bn, token.decimals) }
}

// Frontier is deprecated, we know reserves will stay at 0 for the others
const ANCHOR_RESERVES_TO_CHECK = [
  //'DOLA', 'ETH-1', 'WBTC-1', 'xSUSHI', 'YFY-1'
  '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8',
  '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b',
  '0x7Fcb7DAC61eE35b3D4a51117A7c58D53f0a8a670',
  '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326',
  '0xde2af899040536884e062D3a334F2dD36F34b4a4',
];


export default async function handler(req, res) {
  const { cacheFirst } = req.query;

  const { ANCHOR_TOKENS, UNDERLYING, TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `treasury-assets-cache-v1.0.0`;

  try {
    const cacheDuration = 120;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const mainnet = getNetwork(NetworkIds.mainnet);
    const multisigsToShow = MULTISIGS;

    const mainnetTokens = CHAIN_TOKEN_ADDRESSES["1"];

    const [anchorReserves] = await getGroupedMulticallOutputs([
      ANCHOR_TOKENS.map((ad: string) => {
        const contract = new Contract(ad, CTOKEN_ABI, provider);
        return { contract, functionName: 'totalReserves', params: [], forceFallback: !ANCHOR_RESERVES_TO_CHECK.includes(ad), fallbackValue: BigNumber.from('0') };
      })
    ]);

    const multisigsFundsToCheck = {
      [NetworkIds.mainnet]: Object.keys(CHAIN_TOKENS[NetworkIds.mainnet])
        .filter(key => isAddress(key))
        .filter(key => ![mainnetTokens.MIM, mainnetTokens.FLOKI, mainnetTokens.THREECRV, mainnetTokens.XSUSHI, mainnetTokens.DOLAUSDCUNIV3].includes(key)),
      [NetworkIds.ftm]: [],// not used anymore
      [NetworkIds.optimism]: Object.keys(CHAIN_TOKENS[NetworkIds.optimism]).filter(key => isAddress(key)),
      [NetworkIds.bsc]: Object.keys(CHAIN_TOKENS[NetworkIds.bsc]).filter(key => isAddress(key)),
      [NetworkIds.arbitrum]: Object.keys(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(key => isAddress(key)),
      [NetworkIds.polygon]: Object.keys(CHAIN_TOKENS[NetworkIds.polygon]).filter(key => isAddress(key)),
      [NetworkIds.avalanche]: Object.keys(CHAIN_TOKENS[NetworkIds.avalanche]).filter(key => isAddress(key)),
      [NetworkIds.base]: Object.keys(CHAIN_TOKENS[NetworkIds.base]).filter(key => isAddress(key)),
    }

    const [treasuryBalances, multisigsFunds] = await Promise.all(
      [
        fetchZerionWithRetry(TREASURY, mainnet.zerionId || mainnet.codename),
        Promise.all(
          multisigsToShow.map(multisig => {
            const net = getNetwork(multisig.chainId);
            return fetchZerionWithRetry(multisig.address, net.zerionId || net.codename)
          })
        ),
      ]
    );

    multisigsFunds.map((bns, i) => {
      const multisig = multisigsToShow[i];
      const chainFundsToCheck = multisigsFundsToCheck[multisig.chainId];
      return bns.map((bn, j) => {
        const token = CHAIN_TOKENS[multisig.chainId][chainFundsToCheck[j]]
        if (!!token?.address) {
          const alreadyInFundsIndex = multisigsFunds[i].findIndex(mf => mf.token.address?.toLowerCase() === token.address?.toLowerCase());
          if (alreadyInFundsIndex !== -1) {
            multisigsFunds[i][alreadyInFundsIndex].allowance = 0
          } else {
            multisigsFunds[i].push({
              token,
              balance: 0,
              allowance: null,
            });
          }
        }
      })
    })


    const multisigData = multisigsToShow.map((m, i) => ({
      ...m,
      funds: multisigsFunds[i].filter(d => d.balance || 0 > 0 || d.allowance || 0 > 0),
    }));

    const resultData = {
      timestamp: Date.now(),
      bonds: {
        balances: []//bondManagerBalances.map((bn, i) => formatBn(bn, TOKENS[bondTokens[i]])),
      },
      anchorReserves: anchorReserves.map((bn, i) => formatBn(bn, UNDERLYING[ANCHOR_TOKENS[i]])).filter(d => d.balance > 0),
      treasury: treasuryBalances.filter(d => d.balance > 0),
      multisigs: multisigData,
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
      }
    } catch (e) {
      console.error(e);
    }
  }
}