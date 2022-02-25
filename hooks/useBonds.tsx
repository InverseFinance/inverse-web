
import useEtherSWR from '@app/hooks/useEtherSWR'
import { Bond, SWR } from '@app/types'
import { getBnToNumber } from '@app/util/markets';

import { BONDS, REWARD_TOKEN, RTOKEN_CG_ID } from '@app/variables/tokens'
import { BigNumber } from 'ethers';
import { useAnchorPricesUsd } from './usePrices';
import { getNetworkConfigConstants } from '@app/util/networks';
import { BLOCKS_PER_DAY } from '@app/config/constants';
import { usePrices } from '@app/hooks/usePrices';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router';

const { XINV } = getNetworkConfigConstants();

// controlVariable uint256, vestingTerm uint256, minimumPrice uint256, maxPayout uint256, maxDebt uint256
const termsDefaults = [
  BigNumber.from('38400'),
  BigNumber.from('46200'),
  BigNumber.from('0'),
  BigNumber.from('43'),
  BigNumber.from('481600000000000000000000'),
];

const bondInfoDefaults = [
  BigNumber.from('0'),
  BigNumber.from('46200'),
  BigNumber.from('0'),
  BigNumber.from('0'),
]

export const useBonds = (depositor?: string): SWR & { bonds: Bond[] } => {
  const { prices: oraclePrices } = useAnchorPricesUsd();
  const { prices: cgPrices } = usePrices();
  const { account } = useWeb3React<Web3Provider>();
  const { query } = useRouter();

  const userAddress = depositor || (query?.viewAddress as string) || account;

  const { data: bondPrices, error: bondPricesError } = useEtherSWR([
    ...BONDS.map(bond => {
      return [bond.bondContract, 'trueBondPrice']
    }),
  ]);

  const { data: bondTerms, error: bondTermsError } = useEtherSWR([
    ...BONDS.map(bond => {
      return [bond.bondContract, 'terms']
    }),
  ]);

  const { data: userBondInfo, error: userBondError } = useEtherSWR([
    ...BONDS.map(bond => {
      return [bond.bondContract, 'bondInfo', userAddress]
    }),
  ]);

  const error = bondPricesError || bondTermsError;

  const prices = (bondPrices || BONDS.map(b => BigNumber.from('0')))?.map(bn => getBnToNumber(bn, 7));

  const inputPrices = BONDS.map((bond, i) => {
    return (oraclePrices && oraclePrices[bond.ctoken]) || 0;
  })

  const trueBondPrices = BONDS.map((bond, i) => {
    return prices[i] * inputPrices[i];
  })

  // controlVariable uint256, vestingTerm uint256, minimumPrice uint256, maxPayout uint256, maxDebt uint256
  const terms = (bondTerms || [...BONDS.map(b => termsDefaults)]);

  // payout,
  const bondInfos = (userBondInfo || [...BONDS.map(b => bondInfoDefaults)]);

  const invOraclePrice = oraclePrices && oraclePrices[XINV];
  const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

  const marketPrice = invOraclePrice;

  const bonds = BONDS.map((bond, i) => {
    return {
      ...bond,
      marketPrice,
      roi: (marketPrice / trueBondPrices[i] - 1) * 100,
      usdPrice: trueBondPrices[i],
      inputUsdPrice: inputPrices[i],
      positiveRoi: invOraclePrice > trueBondPrices[i],
      positiveRoiCg: invCgPrice > trueBondPrices[i],
      vestingDays: parseFloat(terms[i][1].toString()) / BLOCKS_PER_DAY,
      maxPayout: parseFloat(terms[i][3].toString()),
      userInfos: {
        payout: getBnToNumber(bondInfos[i][0], REWARD_TOKEN?.decimals),
        vesting : getBnToNumber(bondInfos[i][1], 0),
        lastBlock: getBnToNumber(bondInfos[i][2], 0),
        truePricePaid: getBnToNumber(bondInfos[i][3], 7),
        vestingCompletionBlock: getBnToNumber(bondInfos[i][2], 0) + getBnToNumber(bondInfos[i][1], 0),
      }
    }
  })

  return {
    bonds,
    isError: error,
  }
}