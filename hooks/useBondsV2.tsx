
import useEtherSWR from '@app/hooks/useEtherSWR'
import { Bond, SWR } from '@app/types'
import { getBnToNumber } from '@app/util/markets';

import { BONDS, REWARD_TOKEN, RTOKEN_CG_ID } from '@app/variables/tokens'
import { BigNumber } from 'ethers';
import { useLpPrices } from './usePrices';
import { BLOCKS_PER_DAY } from '@app/config/constants';
import { usePrices } from '@app/hooks/usePrices';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { useCustomSWR } from './useCustomSWR';
import { fetcher } from '@app/util/web3';
import { BONDS_V2 } from '@app/variables/bonds';

// controlVariable uint256, maxDebt uint256, vesting uint256, conclusion uint256
const termsDefaults = [
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
];

const bondInfoDefaults = [
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000',
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('0'),
]

const activeBonds = BONDS_V2//.filter(b => !b.disabled);

export const useBondsV2 = (depositor?: string): SWR & { bonds: Bond[] } => {
  const lpInputs = activeBonds.filter(b => !b.inputPrice).map(b => b.underlying)
  const { data: lpInputPrices } = useLpPrices(lpInputs, ["1", "1"]);
  const { prices: cgPrices } = usePrices();
  const { account } = useWeb3React<Web3Provider>();
  const { query } = useRouter();

  const userAddress = depositor || (query?.viewAddress as string) || account;

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

  // const { data: dataPercentVestedFor } = useEtherSWR([
  //   ...activeBonds.map(bond => {
  //     return [bond.bondContract, 'percentVestedFor', userAddress]
  //   }),
  // ]);

  // const { data: dataPendingPayoutFor } = useEtherSWR([
  //   ...activeBonds.map(bond => {
  //     return [bond.bondContract, 'pendingPayoutFor', userAddress]
  //   }),
  // ]);

  const error = bondPricesError || bondTermsError;

  const prices = (bondPrices);
  const percentVestedFor = 0
  const pendingPayoutFor = 0

  const inputPrices = activeBonds.map((bond, i) => {
    return bond.inputPrice || (lpInputPrices && lpInputPrices[lpInputs.map(lp => lp.symbol).indexOf(bond.underlying.symbol)]) || 0;
  })

  // const trueBondPrices = activeBonds.map((bond, i) => {
  //   return prices[i] * inputPrices[i];
  // })

  // controlVariable uint256, vestingTerm uint256, minimumPrice uint256, maxPayout % uint256, maxDebt uint256
  const terms = (bondTerms || [...activeBonds.map(b => termsDefaults)]);

  // payout,
  const bondInfos = ({} || [...activeBonds.map(b => bondInfoDefaults)]);

  // const invOraclePrice = oraclePrices && oraclePrices[XINV];
  const invCgPrice = cgPrices && cgPrices['weth']?.usd;
  // const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

  // the ROI calculation makes more sense with cg price
  const marketPrice = invCgPrice;

  const bonds = activeBonds.map((bond, i) => {
    const bondPrice = !!prices && !!prices[i] ? getBnToNumber(prices[i], 35) : 0
    return {
      ...bond,
      marketPrice,
      roi: bondPrice ? (marketPrice / bondPrice - 1) * 100 : 0,
      usdPrice: bondPrice,
      inputUsdPrice: inputPrices[i],
      positiveRoi: bondPrice && marketPrice > bondPrice,
      vestingDays: Math.round(parseFloat(terms[i][2].toString())/86400),
      conclusion: parseFloat(terms[i][3].toString())*1000,
      maxPayout: marketInfos ? getBnToNumber(marketInfos[i][8], 9) : 0,
      capacity: marketInfos ? getBnToNumber(marketInfos[i][5], 9) : 0,
      teller: tellers ? tellers[i] : bond.bondContract,
      userInfos: {
        // payout: getBnToNumber(bondInfos[i][0], REWARD_TOKEN?.decimals),
        // vesting: getBnToNumber(bondInfos[i][1], 0),
        // lastBlock: getBnToNumber(bondInfos[i][2], 0),
        // truePricePaid: getBnToNumber(bondInfos[i][3], 7),
        // vestingCompletionBlock: getBnToNumber(bondInfos[i][2], 0) + getBnToNumber(bondInfos[i][1], 0),
        // percentVestedFor: Math.min(percentVestedFor[i], 100),
        // pendingPayoutFor: pendingPayoutFor[i],
      }
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
    bondContract, 'payoutFor', inputAmount.toString(), id, referrer||bondContract
  ]);

  // handle abi variant
  const result = data && data.length === 2 ? data[0] : data

  return {
    payout: result ? formatUnits(result, outputDecimals) : '0',
  }
}

export const useBondsDeposits = (): SWR & {
  deposits: {
    type: string,
    duration: number,
    inputAmount: number,
    outputAmount: number,
    accOutputAmount: number,
    accInputAmount: number,
    accTypeAmount: number,
    txHash: string,
    timestamp: number,
    input: string,
  }[],
  acc: { [key: string]: number },
  lastUpdate: number,
} => {
  const { data, error, isLoading } = useCustomSWR(`/api/transparency/bonds-deposits`, fetcher);

  return {
    deposits: data ? data.deposits : [],
    acc: data ? data.acc : {},
    lastUpdate: data ? data.lastUpdate : null,
    isLoading,
    isError: !!error,
  }
}