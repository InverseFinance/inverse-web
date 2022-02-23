
import useEtherSWR from '@app/hooks/useEtherSWR'
import { SWR } from '@app/types'
import { getBnToNumber } from '@app/util/markets';

import { BONDS } from '@app/variables/tokens'
import { BigNumber } from 'ethers';

export const useBonds = (): SWR & { bondPrices: number[], bondTerms: any } => {
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

  return {
    bondPrices: (bondPrices||[BigNumber.from('0'),BigNumber.from('0'),BigNumber.from('0')])?.map(bn => getBnToNumber(bn, 7)),
    bondTerms,
    isError: error,
  }
}