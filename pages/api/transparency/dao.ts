import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { CTOKEN_ABI, DOLA_ABI, ERC20_ABI, INV_ABI, MULTISIG_ABI } from '@app/config/abis'
import { getNetwork, getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, Multisig, NetworkIds, Token } from '@app/types';
import { getBnToNumber, getNumberToBn } from '@app/util/markets'
import { CHAIN_TOKENS, CHAIN_TOKEN_ADDRESSES } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { DOLA_BRIDGED_CHAINS, INV_BRIDGED_CHAINS, ONE_DAY_SECS } from '@app/config/constants';
import { liquidityCacheKey } from './liquidity';
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

export const cacheMultisigMetaKey = `dao-multisigs-meta-v1.0.9`;
export const cacheFedsMetaKey = `dao-feds-meta-v1.0.3`;
export const cacheMulBalKey = `dao-multisigs-bal-v1.0.96`;
export const cacheMulAllKey = `dao-multisigs-all-v1.0.55`;
export const cacheDolaSupplies = `dao-dola-supplies-v1.0.2`;
export const cacheFedDataKey = `dao-feds-datas-v1.0.3`;
export const cacheMultisigDataKey = `dao-multisigs-data-v1.0.92`;

export default async function handler(req, res) {
  const { cacheFirst } = req.query;

  const { DOLA, INV, ANCHOR_TOKENS, UNDERLYING, FEDS, TREASURY, MULTISIGS, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const cacheKey = `dao-cache-v1.4.2`;

  try {
    const cacheDuration = 360;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const dolaContract = new Contract(DOLA, DOLA_ABI, provider);
    const invContract = new Contract(INV, INV_ABI, provider);

    let dolaBridgedSupplies = [];
    let invBridgedSupplies = [];

    // public rpc for fantom, less reliable
    try {
      const supplyData = await Promise.all([
        await Promise.all(
          INV_BRIDGED_CHAINS.map(chainId => {
            const dolaOnBridgedChain = new Contract(CHAIN_TOKEN_ADDRESSES[chainId]['INV'], ERC20_ABI, getProvider(chainId));
            return dolaOnBridgedChain.totalSupply();
          })
        ),
        await Promise.all(
          DOLA_BRIDGED_CHAINS.map(chainId => {
            const dolaOnBridgedChain = new Contract(CHAIN_TOKEN_ADDRESSES[chainId]['DOLA'], ERC20_ABI, getProvider(chainId));
            return dolaOnBridgedChain.totalSupply();
          })
        ),
      ]);
      invBridgedSupplies = supplyData[0];
      dolaBridgedSupplies = supplyData[1];
    } catch (e) {

    }

    const fedsCache = await getCacheFromRedis(cacheFedsMetaKey, true, 1800);
    const [
      dolaTotalSupply,
      invTotalSupply,
      dolaOperator,
      ...fedData
    ] = fedsCache || (await Promise.all([
      dolaContract.totalSupply(),
      invContract.totalSupply(),
      dolaContract.operator(),
      ...FEDS.map((fed: Fed) => {
        const fedContract = new Contract(fed.address, fed.abi, getProvider(fed.chainId));
        return Promise.all([
          fedContract[fed.isXchain ? 'dstSupply' : (fed.supplyFuncName || 'supply')](),
          fedContract[fed.isXchain ? 'GOV' : 'gov'](),
          fedContract['chair'](),
        ]);
      }),
    ]))
    if (!fedsCache) {
      await redisSetWithTimestamp(cacheFedsMetaKey, [
        dolaTotalSupply,
        invTotalSupply,
        dolaOperator,
        ...fedData
      ]);
    }
    const dolaTotalSupplyNum = getBnToNumber(BigNumber.from(dolaTotalSupply));
    const invTotalSupplyNum = getBnToNumber(BigNumber.from(invTotalSupply));

    const mainnetTokens = CHAIN_TOKEN_ADDRESSES["1"];
    const treasuryFundsToCheck = [
      mainnetTokens.INV, mainnetTokens.DOLA, mainnetTokens.DAI, mainnetTokens.USDC, mainnetTokens.USDT, mainnetTokens.WETH, mainnetTokens.WBTC, mainnetTokens.INVETHLP, mainnetTokens.INVETHSLP, mainnetTokens.CRV, mainnetTokens.CVX, mainnetTokens.BAL, mainnetTokens.AURA, mainnetTokens.DBR, mainnetTokens.YFI, mainnetTokens.FRAX
    ];
    const [treasuryBalances, anchorReserves] = await getGroupedMulticallOutputs([
      treasuryFundsToCheck.map((ad: string) => {
        const contract = new Contract(ad, ERC20_ABI, provider);
        return { contract, functionName: 'balanceOf', params: [TREASURY] };
      }),
      ANCHOR_TOKENS.map((ad: string) => {
        const contract = new Contract(ad, CTOKEN_ABI, provider);
        return { contract, functionName: 'totalReserves', params: [], forceFallback: !ANCHOR_RESERVES_TO_CHECK.includes(ad), fallbackValue: BigNumber.from('0') };
      })
    ]);

    const multisigsToShow = MULTISIGS;

    // Multisigs
    const multisigMetaCache = await getCacheFromRedis(cacheMultisigMetaKey, true, ONE_DAY_SECS);
    const [multisigsOwners, multisigsThresholds] = (multisigMetaCache || await Promise.all([
      Promise.all(multisigsToShow.map((m) => {
        const provider = getProvider(m.chainId);
        const contract = new Contract(m.address, MULTISIG_ABI, provider);
        return contract.getOwners();
      })),
      Promise.all(multisigsToShow.map((m) => {
        const provider = getProvider(m.chainId);
        const contract = new Contract(m.address, MULTISIG_ABI, provider);
        return contract.getThreshold();
      })),
    ]));

    if (!multisigMetaCache) {
      await redisSetWithTimestamp(cacheMultisigMetaKey, [multisigsOwners, multisigsThresholds]);
    }

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

    // const [multisigBalCache, liquidityCacheData] = await Promise.all([
    //   getCacheFromRedis(cacheMulBalKey, true, 300),
    //   getCacheFromRedis(liquidityCacheKey, false),
    // ]);
    // const multisigsBalanceValues: BigNumber[][] = multisigBalCache?.map(bns => bns.map(bn => Array.isArray(bn) ? BigNumber.from(bn[0]) : BigNumber.from(bn))) || (await Promise.all([
    //   ...multisigsToShow.map((m) => {
    //     const provider = getProvider(m.chainId);
    //     const chainFundsToCheck = multisigsFundsToCheck[m.chainId];
    //     return Promise.all(
    //       chainFundsToCheck.map(tokenAddress => {
    //         const token = CHAIN_TOKENS[m.chainId][tokenAddress]
    //         const isTWGtype = m.shortName.includes('TWG');
    //         const isLockedConvexPool = !!token && !!token.convexInfos?.account && m.shortName === 'TWG';
    //         if (
    //           // reduce numbers of check
    //           (!isTWGtype && m.shortName !== 'BBP' && !['DOLA', 'INV'].includes(token?.symbol))
    //           || (m.shortName === 'BBP' && !['DOLA', 'INV', 'USDC', 'USDT', 'DAI'].includes(token?.symbol))
    //           // skip yearn vaults
    //           || token?.symbol?.startsWith('yv')
    //           // skip token with specific twg address if diff
    //           || (!!token?.twgAddress && token?.twgAddress !== m.address)
    //         ) {
    //           return new Promise((res) => res(BigNumber.from('0')));
    //         }
    //         // non-standard balance cases first
    //         else if (!!token.veNftId) {
    //           if(token.isLockedVeNft) {
    //             const contract = new Contract(token.address, ['function locked(uint) public view returns (uint, uint)'], provider);
    //             return contract.locked(token.veNftId);  
    //           } else {
    //             const contract = new Contract(token.address, ['function balanceOfNFT(uint) public view returns (uint)'], provider);
    //             return contract.balanceOfNFT(token.veNftId);
    //           }
    //         } else if (token.symbol === 'vlAURA') {
    //           const contract = new Contract(token.address, ['function balances(address) public view returns (tuple(uint, uint))'], provider);
    //           return contract.balances(m.address);
    //         } else if (isLockedConvexPool) {
    //           const contract = new Contract(token.address, ['function totalBalanceOf(address) public view returns (uint)'], provider);
    //           return contract.totalBalanceOf(token.convexInfos.account);
    //         } // for uniV3 nft pos, we treat lp price as $1 and balance = ownedAmount $
    //         else if (token.isUniV3) {
    //           if(liquidityCacheData?.liquidity) {
    //             const lpData = liquidityCacheData.liquidity.find(lp => lp.address === (token.uniV3Pool||tokenAddress));
    //             if(lpData) {
    //               return getNumberToBn(token.uniV3Pool ? lpData.srcTvl : lpData.ownedAmount, lpData.decimals);
    //             }
    //           }
    //           return new Promise((res) => res(BigNumber.from('0')));
    //         } else {
    //           const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    //           return contract.balanceOf(m.address);
    //         }
    //       })
    //         .concat([
    //           provider.getBalance(m.address),
    //         ])
    //     )
    //   })
    // ]));
    // if (!multisigBalCache) {
    //   await redisSetWithTimestamp(cacheMulBalKey, multisigsBalanceValues);
    // }

    const multisigAllCache = await getCacheFromRedis(cacheMulAllKey, true, 300);
    const multisigsAllowanceValues: BigNumber[][] = multisigAllCache?.map(bns => bns.map(bn => BigNumber.from(bn))) || ((await Promise.all([
      ...multisigsToShow.map((m) => {
        const provider = getProvider(m.chainId);
        const chainFundsToCheck = multisigsFundsToCheck[m.chainId];
        return Promise.allSettled(
          chainFundsToCheck.map(tokenAddress => {
            const token = CHAIN_TOKENS[m.chainId][tokenAddress]
            const isTWGtype = m.shortName.includes('TWG');
            if (
              // reduce numbers of check
              (!isTWGtype && m.shortName !== 'BBP' && !['DOLA', 'INV'].includes(token?.symbol))
              || (m.shortName === 'BBP' && !['DOLA', 'INV', 'USDC', 'USDT', 'DAI'].includes(token?.symbol))
              || (['TWG on FTM', 'TWG on OP', 'TWG on BSC', 'TWG on ARB 1', 'TWG on ARB 2', 'AWG', 'RWG', 'FedChair'].includes(m.shortName))
              // skip yearn vaults
              || token?.symbol?.startsWith('yv')
            ) {
              return new Promise((res) => res(BigNumber.from('0')));
            } else {
              const contract = new Contract(tokenAddress, ERC20_ABI, provider);
              return contract.allowance(TREASURY, m.address);
            }
          })
        )
      })
    ])).map(m => m.map(a => a.status === 'fulfilled' ? a.value : BigNumber.from('0'))));
    if (!multisigAllCache) {
      await redisSetWithTimestamp(cacheMulAllKey, multisigsAllowanceValues);
    }

    const multisigsFunds = await Promise.all(
      multisigsToShow.map(multisig => {
        const net = getNetwork(multisig.chainId);
        return fetchZerionWithRetry(multisig.address, net.zerionId || net.codename)
      })
    );

    multisigsAllowanceValues.map((bns, i) => {
      const multisig = multisigsToShow[i];
      const chainFundsToCheck = multisigsFundsToCheck[multisig.chainId];
      return bns.map((bn, j) => {
        const token = CHAIN_TOKENS[multisig.chainId][chainFundsToCheck[j]]
        if (!!token?.address) {
          const allowance = multisigsAllowanceValues[i][j]
          const alreadyInFundsIndex = multisigsFunds[i].findIndex(mf => mf.token.address?.toLowerCase() === token.address?.toLowerCase());
          if (alreadyInFundsIndex !== -1) {
            multisigsFunds[i][alreadyInFundsIndex].allowance = allowance !== undefined ? getBnToNumber(allowance, token.decimals) : null;
          } else {
            multisigsFunds[i].push({
              token,
              balance: 0,
              allowance: allowance !== undefined ? getBnToNumber(allowance, token.decimals) : null,
            });
          }
        }
      })
    })

    // const multisigsFunds = multisigsBalanceValues.map((bns, i) => {
    //   const multisig = multisigsToShow[i];
    //   const chainFundsToCheck = multisigsFundsToCheck[multisig.chainId];
    //   return bns.map((bn, j) => {
    //     const token = CHAIN_TOKENS[multisig.chainId][chainFundsToCheck[j]] || CHAIN_TOKENS[multisig.chainId]['CHAIN_COIN'];
    //     const allowance = multisigsAllowanceValues[i][j]
    //     return {
    //       token,
    //       // handle non-standard vlAURA, locked veThena balance in array case
    //       balance: getBnToNumber(Array.isArray(bn) ? bn[0] : bn, token.decimals),
    //       allowance: allowance !== undefined ? getBnToNumber(allowance, token.decimals) : null,
    //     }
    //   })
    // })

    // Bonds v2 - no more used
    // const bondTokens = [INV, DOLA, DOLA3POOLCRV, INVDOLASLP];
    // const bondManagerBalances: BigNumber[] = await Promise.all(
    //   bondTokens.map(tokenAddress => {
    //     const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    //     return contract.balanceOf(OP_BOND_MANAGER);
    //   })
    // )

    const toSupplies = (total: number, bridgedSupplies: BigNumber[], bridgedChains: string[]) => {
      return [
        {
          chainId: NetworkIds.mainnet,
          supply: total - bridgedSupplies.reduce((prev, curr) => prev + getBnToNumber(curr), 0),
        },
        ...bridgedSupplies.map((bn, i) => {
          return { chainId: bridgedChains[i], supply: getBnToNumber(bn) };
        })
      ];
    }

    const dolaSupplies = toSupplies(dolaTotalSupplyNum, dolaBridgedSupplies, DOLA_BRIDGED_CHAINS);
    const invSupplies = toSupplies(invTotalSupplyNum, invBridgedSupplies, INV_BRIDGED_CHAINS);

    const fedsData = FEDS.map((fed, i) => ({
      ...fed,
      abi: undefined,
      strategy: undefined,
      supply: getBnToNumber(fedData[i][0]),
      gov: fedData[i][1],
      chair: fedData[i][2],
    }));

    const multisigData = multisigsToShow.map((m, i) => ({
      ...m,
      owners: multisigsOwners[i],
      funds: multisigsFunds[i].filter(d => d.balance || 0 > 0 || d.allowance || 0 > 0),
      // when multisigsThresholds is from cache, type is not BN object
      threshold: parseInt(BigNumber.from(multisigsThresholds[i]).toString()),
    }));

    const resultData = {
      timestamp: Date.now(),
      dolaTotalSupply: dolaTotalSupplyNum,
      invTotalSupply: invTotalSupplyNum,
      dolaOperator,
      bonds: {
        balances: []//bondManagerBalances.map((bn, i) => formatBn(bn, TOKENS[bondTokens[i]])),
      },
      anchorReserves: anchorReserves.map((bn, i) => formatBn(bn, UNDERLYING[ANCHOR_TOKENS[i]])).filter(d => d.balance > 0),
      treasury: treasuryBalances.map((bn, i) => formatBn(bn, TOKENS[treasuryFundsToCheck[i]])).filter(d => d.balance > 0),
      dolaSupplies,
      invSupplies,
      multisigs: multisigData,
      feds: fedsData,
    }

    await redisSetWithTimestamp(cacheDolaSupplies, {
      dolaTotalSupply: resultData.dolaTotalSupply,
      dolaSupplies,
    });

    redisSetWithTimestamp(cacheFedDataKey, fedsData);
    redisSetWithTimestamp(cacheMultisigDataKey, multisigData);

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