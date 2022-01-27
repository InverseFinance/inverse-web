import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { CTOKEN_ABI, DOLA_ABI, ERC20_ABI, INV_ABI, MULTISIG_ABI } from '@app/config/abis'
import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Fed, NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'

export default async function handler(req, res) {

  const { DOLA, INV, DAI, INVDOLASLP, ANCHOR_TOKENS, UNDERLYING, USDC, WCOIN, FEDS, TREASURY, MULTISIGS, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);
  const ftmConfig = getNetworkConfig(NetworkIds.ftm, false);
  const cacheKey = `dao-cache-v1.1.3`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 300);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const dolaContract = new Contract(DOLA, DOLA_ABI, provider);
    const invContract = new Contract(INV, INV_ABI, provider);

    let invFtmTotalSupply = BigNumber.from('0');
    let dolaFtmTotalSupply = BigNumber.from('0');

    // public rpc for fantom, less reliable
    try {
      const ftmProvider = getProvider(NetworkIds.ftm);
      const dolaFtmContract = new Contract(ftmConfig?.DOLA, ERC20_ABI, ftmProvider);
      const invFtmContract = new Contract(ftmConfig?.INV, ERC20_ABI, ftmProvider);
      dolaFtmTotalSupply = await dolaFtmContract.totalSupply();
      invFtmTotalSupply = await invFtmContract.totalSupply();
    } catch (e) {

    }

    const [
      dolaTotalSupply,
      invTotalSupply,
      dolaOperator,
      ...fedData
    ] = await Promise.all([
      dolaContract.totalSupply(),
      invContract.totalSupply(),
      dolaContract.operator(),
      ...FEDS.map((fed: Fed) => {
        const fedContract = new Contract(fed.address, fed.abi, getProvider(fed.chainId));
        return Promise.all([
          fedContract[fed.isXchain ? 'dstSupply' : 'supply'](),
          fedContract[fed.isXchain ? 'GOV' : 'gov'](),
          fedContract['chair'](),
        ]);
      }),
    ])

    const treasuryFundsToCheck = [DOLA, INV, DAI, USDC, INVDOLASLP];
    const treasuryBalances = await Promise.all([
      ...treasuryFundsToCheck.map((ad: string) => {
        const contract = new Contract(ad, ERC20_ABI, provider);
        return contract.balanceOf(TREASURY);
      }),
    ])

    const anchorReserves = await Promise.all([
      ...ANCHOR_TOKENS.map((ad: string) => {
        const contract = new Contract(ad, CTOKEN_ABI, provider);
        return contract.totalReserves();
      }),
    ]);

    // Multisigs
    const multisigsOwners = await Promise.all([
      ...Object.entries(MULTISIGS).map(([address, name]) => {
        const contract = new Contract(address, MULTISIG_ABI, provider);
        return contract.getOwners();
      })
    ])

    const multisigsThresholds = await Promise.all([
      ...Object.entries(MULTISIGS).map(([address, name]) => {
        const contract = new Contract(address, MULTISIG_ABI, provider);
        return contract.getThreshold();
      })
    ])

    const fundsToCheck = [INV, DOLA, DAI, WCOIN];
    const multisigsBalanceValues: BigNumber[][] = await Promise.all([
      ...Object.entries(MULTISIGS).map(([multisigAd, name]) => {
        return Promise.all(
          fundsToCheck.map(tokenAddress => {
            const contract = new Contract(tokenAddress, ERC20_ABI, provider);
            return contract.balanceOf(multisigAd);
          })
            .concat([
              provider.getBalance(multisigAd),
            ])
        )
      })
    ])

    const multisigsAllowanceValues: BigNumber[][] = await Promise.all([
      ...Object.entries(MULTISIGS).map(([multisigAd, name]) => {
        return Promise.all(
          fundsToCheck.map(tokenAddress => {
            const contract = new Contract(tokenAddress, ERC20_ABI, provider);
            return contract.allowance(TREASURY, multisigAd);
          })
        )
      })
    ])

    const multisigsFunds = multisigsBalanceValues.map((bns, i) => {
      return bns.map((bn, j) => {
        const token = TOKENS[fundsToCheck[j]] || TOKENS['CHAIN_COIN'];
        const allowance = multisigsAllowanceValues[i][j]
        return {
          token,
          balance: getBnToNumber(bn, token.decimals),
          allowance: allowance !== undefined ? getBnToNumber(allowance, token.decimals) : null,
        }
      })
    })

    const resultData = {
      dolaTotalSupply: getBnToNumber(dolaTotalSupply),
      invTotalSupply: getBnToNumber(invTotalSupply),
      dolaOperator,
      anchorReserves: anchorReserves.map((bn, i) => {
        const token = UNDERLYING[ANCHOR_TOKENS[i]];
        return { token, balance: getBnToNumber(bn, token.decimals) }
      }),
      treasury: treasuryBalances.map((bn, i) => {
        const token = TOKENS[treasuryFundsToCheck[i]];
        return { token, balance: getBnToNumber(bn, token.decimals) }
      }),
      fantom: {
        dolaTotalSupply: getBnToNumber(dolaFtmTotalSupply),
        invTotalSupply: getBnToNumber(invFtmTotalSupply),
      },
      multisigs: Object.entries(MULTISIGS).map(([address, name], i) => ({
        address, name, owners: multisigsOwners[i], funds: multisigsFunds[i], threshold: parseInt(multisigsThresholds[i].toString()),
      })),
      feds: FEDS.map((fed, i) => ({
        ...fed,
        abi: undefined,
        supply: getBnToNumber(fedData[i][0]),
        gov: fedData[i][1],
        chair: fedData[i][2],
      }))
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
