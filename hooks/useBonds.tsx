
import useEtherSWR from '@app/hooks/useEtherSWR'
import { Bond, SWR } from '@app/types'
import { getBnToNumber } from '@app/util/markets';

import { BONDS } from '@app/variables/tokens'
import { BigNumber } from 'ethers';
import { useAnchorPricesUsd } from './usePrices';
import { getNetworkConfigConstants } from '@app/util/networks';
import { BLOCKS_PER_DAY } from '@app/config/constants';

const { XINV } = getNetworkConfigConstants();

// controlVariable uint256, vestingTerm uint256, minimumPrice uint256, maxPayout uint256, maxDebt uint256
const termsDefaults = [
  BigNumber.from('38400'),
  BigNumber.from('46200'),
  BigNumber.from('0'),
  BigNumber.from('43'),
  BigNumber.from('481600000000000000000000'),
]

export const useBonds = (): SWR & { bonds: Bond[] } => {
  const { prices: oraclePrices } = useAnchorPricesUsd();

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

  const error = bondPricesError || bondTermsError;

  const prices = (bondPrices || BONDS.map(b => BigNumber.from('0')))?.map(bn => getBnToNumber(bn, 7));

  const trueBondPrices = BONDS.map((bond, i) => {
    return prices[i] * (oraclePrices && oraclePrices[bond.ctoken]) || 0;
  })

  // controlVariable uint256, vestingTerm uint256, minimumPrice uint256, maxPayout uint256, maxDebt uint256
  const terms = (bondTerms || [...BONDS.map(b => termsDefaults)]);

  const invOraclePrice = oraclePrices && oraclePrices[XINV];

  const bonds = BONDS.map((bond, i) => {
    return {
      ...bond,
      usdPrice: trueBondPrices[i],
      positiveRoi: invOraclePrice > trueBondPrices[i],
      vestingDays: parseFloat(terms[i][1].toString()) / BLOCKS_PER_DAY,
      maxPayout: parseFloat(terms[i][3].toString()),
    }
  })

  return {
    bonds,
    isError: error,
  }
}