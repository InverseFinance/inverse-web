
import useEtherSWR from '@app/hooks/useEtherSWR'
import { BondV2, SWR } from '@app/types'
import { getBnToNumber } from '@app/util/markets';

import { REWARD_TOKEN, RTOKEN_CG_ID } from '@app/variables/tokens'
import { usePrices } from '@app/hooks/usePrices';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { useCustomSWR } from './useCustomSWR';
import { fetcher } from '@app/util/web3';
import { useContractEvents } from './useContractEvents';
import { BOND_V2_FIXED_TELLER_ABI } from '@app/config/abis';

export const useBondsV2Api = (): SWR & { bonds: BondV2[] } => {
  const { data, error, isLoading } = useCustomSWR(`/api/bonds`, fetcher);

  return {
    bonds: data ? data.bonds : [],
    error,
  }
}

export const useBondsV2 = (): SWR & { bonds: BondV2[] } => {
  const { prices: cgPrices } = usePrices();
  const { bonds: activeBonds } = useBondsV2Api();

  const { data: bondPrices, error: bondPricesError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'marketPrice', bond.id]
    }),
  ]);

  const { data: tellers, error: tellersError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'getTeller']
    }),
  ]);

  const { data: marketInfos, error: marketInfosError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'markets', bond.id]
    }),
  ]);

  const { data: bondTerms, error: bondTermsError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'terms', bond.id]
    }),
  ]);

  const error = bondPricesError || bondTermsError;

  const prices = (bondPrices);

  // const invOraclePrice = oraclePrices && oraclePrices[XINV];
  const invCgPrice = cgPrices && cgPrices['weth']?.usd;
  // const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

  // the ROI calculation makes more sense with cg price
  const marketPrice = invCgPrice;

  const bonds = activeBonds.map((bond, i) => {
    const bondPrice = !!prices && !!prices[i] ? getBnToNumber(prices[i], 35) : activeBonds[i].bondPrice
    return {
      ...bond,
      marketPrice,
      roi: bondPrice ? (marketPrice / bondPrice - 1) * 100 : 0,
      bondPrice,
      inputUsdPrice: 1,
      positiveRoi: bondPrice && marketPrice > bondPrice,
      vestingDays: bondTerms ? Math.round(parseFloat(bondTerms[i][2].toString()) / 86400) : activeBonds[i].vestingDays,
      conclusion: bondTerms ? parseFloat(bondTerms[i][3].toString()) * 1000 : activeBonds[i].conclusion,
      maxPayout: marketInfos ? getBnToNumber(marketInfos[i][8], REWARD_TOKEN?.decimals) : activeBonds[i].maxPayout,
      capacity: marketInfos ? getBnToNumber(marketInfos[i][5], REWARD_TOKEN?.decimals) : activeBonds[i].capacity,
      teller: tellers ? tellers[i] : activeBonds[i].teller,
    }
  })

  return {
    bonds,
    isError: error,
  }
}

export const useBondV2PayoutFor = (bondContract: string, id: string, inputDecimals: number, amount: string, outputDecimals: number, referrer = ''): { payout: string } => {
  const inputAmount = amount ? parseUnits(amount, inputDecimals) : '0';

  const { data, error } = useEtherSWR([
    bondContract, 'payoutFor', inputAmount.toString(), id, referrer || bondContract
  ]);

  // handle abi variant
  const result = data && data.length === 2 ? data[0] : data

  return {
    payout: result ? formatUnits(result, outputDecimals) : '0',
  }
}

export const useAccountBonds = (
  account: string,
  teller: string,
): SWR & {
  
} => {
  return useContractEvents(teller, BOND_V2_FIXED_TELLER_ABI, 'TransferSingle', [undefined, undefined, account]);
}