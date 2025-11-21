
import useEtherSWR from '@app/hooks/useEtherSWR'
import { Bond, SWR } from '@app/types'
import { getBnToNumber } from '@app/util/markets';

import { BONDS, REWARD_TOKEN, RTOKEN_CG_ID } from '@app/variables/tokens'
import { BigNumber } from 'ethers';
import { useLpPrices } from './usePrices';
import { BLOCKS_PER_DAY } from '@app/config/constants';
import { usePrices } from '@app/hooks/usePrices';
import { useWeb3React } from '@app/util/wallet';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/router';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { useCustomSWR } from './useCustomSWR';
import { fetcher } from '@app/util/web3';
import { getNetworkConfigConstants } from '@app/util/networks';

// controlVariable uint256, vestingTerm uint256, minimumPrice uint256, maxPayout uint256, maxDebt uint256
const termsDefaults = [
  BigNumber.from('38400'),
  BigNumber.from('46200'),
  BigNumber.from('0'),
  BigNumber.from('0'),
  BigNumber.from('481600000000000000000000'),
];

const bondInfoDefaults = [
  BigNumber.from('0'),
  BigNumber.from('46200'),
  BigNumber.from('0'),
  BigNumber.from('0'),
]

const activeBonds = BONDS.filter(b => !b.disabled);

const { OP_BOND_MANAGER, INV } = getNetworkConfigConstants();

export const useBonds = (depositor?: string): SWR & { bonds: Bond[] } => {
  const lpInputs = activeBonds.filter(b => !b.inputPrice).map(b => b.underlying)
  const { data: lpInputPrices } = useLpPrices(lpInputs, ["1", "1"]);
  const { prices: cgPrices } = usePrices();
  const { account } = useWeb3React<Web3Provider>();
  const { query } = useRouter();

  const userAddress = depositor || (query?.viewAddress as string) || account;

  const { data: invBalBn, error: bibi } = useEtherSWR([
    INV, 'balanceOf', OP_BOND_MANAGER
  ]);

  const { data: bondPrices, error: bondPricesError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'trueBondPrice']
    }),
  ]);

  const { data: bondTerms, error: bondTermsError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'terms']
    }),
  ]);


  const { data: bondMaxPayouts, error: bondMaxPayoutsErr } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'maxPayout']
    }),
  ]);

  const { data: userBondInfo, error: userBondError } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'bondInfo', userAddress]
    }),
  ]);

  const { data: dataPercentVestedFor } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'percentVestedFor', userAddress]
    }),
  ]);

  const { data: dataPendingPayoutFor } = useEtherSWR([
    ...activeBonds.map(bond => {
      return [bond.bondContract, 'pendingPayoutFor', userAddress]
    }),
  ]);

  const error = bondPricesError || bondTermsError;

  const prices = (bondPrices || activeBonds.map(b => BigNumber.from('0')))?.map(bn => getBnToNumber(bn, 7));
  const percentVestedFor = (dataPercentVestedFor || activeBonds.map(b => BigNumber.from('0')))?.map(bn => getBnToNumber(bn, 0) / 100);
  const pendingPayoutFor = (dataPendingPayoutFor || activeBonds.map(b => BigNumber.from('0')))?.map((bn, i) => getBnToNumber(bn, activeBonds[i].underlying.decimals));

  const inputPrices = activeBonds.map((bond, i) => {
    return bond.inputPrice || (lpInputPrices && lpInputPrices[lpInputs.map(lp => lp.symbol).indexOf(bond.underlying.symbol)]) || 0;
  })

  const trueBondPrices = activeBonds.map((bond, i) => {
    return prices[i] * inputPrices[i];
  })

  // controlVariable uint256, vestingTerm uint256, minimumPrice uint256, maxPayout % uint256, maxDebt uint256
  const terms = (bondTerms || [...activeBonds.map(b => termsDefaults)]);

  // payout,
  const bondInfos = (userBondInfo || [...activeBonds.map(b => bondInfoDefaults)]);

  // const invOraclePrice = oraclePrices && oraclePrices[XINV];
  const invCgPrice = cgPrices && cgPrices[RTOKEN_CG_ID]?.usd;

  // the ROI calculation makes more sense with cg price
  const marketPrice = invCgPrice;

  const invBal = invBalBn ? getBnToNumber(invBalBn) : 0;

  const bonds = activeBonds.map((bond, i) => {
    return {
      ...bond,
      marketPrice,
      roi: trueBondPrices[i] ? (marketPrice / trueBondPrices[i] - 1) * 100 : 0,
      usdPrice: trueBondPrices[i] ? trueBondPrices[i] : 0,
      inputUsdPrice: inputPrices[i],
      positiveRoi: marketPrice > trueBondPrices[i],
      vestingDays: Math.round(parseFloat(terms[i][1].toString()) / BLOCKS_PER_DAY),
      maxPayout: bondMaxPayouts ? Math.min(getBnToNumber(bondMaxPayouts[i], REWARD_TOKEN?.decimals), invBal) : 0,
      userInfos: {
        payout: getBnToNumber(bondInfos[i][0], REWARD_TOKEN?.decimals),
        vesting: getBnToNumber(bondInfos[i][1], 0),
        lastBlock: getBnToNumber(bondInfos[i][2], 0),
        truePricePaid: getBnToNumber(bondInfos[i][3], 7),
        vestingCompletionBlock: getBnToNumber(bondInfos[i][2], 0) + getBnToNumber(bondInfos[i][1], 0),
        percentVestedFor: Math.min(percentVestedFor[i], 100),
        pendingPayoutFor: pendingPayoutFor[i],
      }
    }
  })

  return {
    bonds,
    isError: error,
  }
}

export const useBondPayoutFor = (bondContract: string, inputDecimals: number, amount: string, outputDecimals: number): { payout: string } => {
  const inputAmount = amount ? parseUnits(amount, inputDecimals) : '0';

  const { data } = useEtherSWR([
    bondContract, 'payoutFor', inputAmount.toString()
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