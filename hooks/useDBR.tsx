import { F2_SIMPLE_ESCROW } from "@app/config/abis";
import { F2Market, SWR } from "@app/types"
import { getBnToNumber } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks"
import { TOKENS } from "@app/variables/tokens";
import { BigNumber } from "ethers/lib/ethers";
import useEtherSWR from "./useEtherSWR"

const { DBR, F2_MARKETS, F2_ORACLE } = getNetworkConfigConstants();

const zero = BigNumber.from('0');
const oneDay = 86400000;
const oneYear = oneDay * 365;

export const useAccountDBR = (account: string): SWR & {
  balance: number,
  debt: number,
  interests: number,
  signedBalance: number,
  dailyDebtAccrual: number,
  dbrNbDaysExpiry: number,
  dbrExpiryDate: number,
  dbrDepletionPerc: number,
  bnDebt: BigNumber,
} => {
  const { data, error } = useEtherSWR([
    [DBR, 'balanceOf', account],
    [DBR, 'debts', account],
    [DBR, 'dueTokensAccrued', account],
    [DBR, 'signedBalanceOf', account],
    // [DBR, 'lastUpdated', account],
  ]);

  const [balance, debt, interests, signedBalance] = (data || [zero, zero, zero, zero, zero])
    .map(v => getBnToNumber(v));
  // const [balance, allowance, debt, interests, signedBalance] = [100, 0, 5000, 0, 2500];

  // interests are not auto-compounded
  const dailyDebtAccrual = (oneDay * debt / oneYear);
  // at current debt accrual rate, when will DBR be depleted?
  const dbrNbDaysExpiry = dailyDebtAccrual ? balance / dailyDebtAccrual : 0;
  const dbrExpiryDate = (+new Date() + dbrNbDaysExpiry * oneDay);
  const dbrDepletionPerc = dbrNbDaysExpiry / 365 * 100;

  return {
    balance,
    debt,
    interests,
    signedBalance,
    dailyDebtAccrual,
    dbrNbDaysExpiry,
    dbrExpiryDate,
    dbrDepletionPerc,
    bnDebt: data ? data[1] : zero,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRMarkets = (marketOrList?: string | string[]): {
  markets: F2Market[]
} => {
  const _markets = Array.isArray(marketOrList) ? marketOrList : !!marketOrList ? [marketOrList] : [];
  const markets = F2_MARKETS
    .filter(m => !!marketOrList ? _markets.includes(m.address) : true)
    .map(m => {
      return {
        ...m,
        underlying: TOKENS[m.collateral],
      }
    });
  const nbMarkets = markets.length;

  const { data, error } = useEtherSWR([
    ...markets.map(m => {
      return [F2_ORACLE, 'getPrice', m.collateral]
    }),
    ...markets.map(m => {
      return [m.address, 'collateralFactorBps']
    }),
    ...markets.map(m => {
      return [m.address, 'totalDebt']
    }),
  ]);

  return {
    markets: markets.map((m, i) => {
      return {
        ...m,
        supplyApy: 0,
        price: data ? getBnToNumber(data[i * nbMarkets]) : 0,
        collateralFactor: data ? getBnToNumber(data[i * nbMarkets + 1], 2) : 0,
        totalDebt: data ? getBnToNumber(data[i * nbMarkets + 2]) : 0,
      }
    }),
  }
}

export const useAccountDBRMarket = (market: any, account: string): {
  escrow: string | undefined
  deposits: number
  bnDeposits: BigNumber
  creditLimit: number
  bnCreditLimit: BigNumber
  withdrawalLimit: number
  bnWithdrawalLimit: BigNumber
} => {
  const { data: accountMarketData, error } = useEtherSWR([
    [market.address, 'escrows', account],
    [market.address, 'getCreditLimit', account],
    [market.address, 'getWithdrawalLimit', account],
  ]);

  const [escrow, creditLimit, withdrawalLimit] = accountMarketData || [undefined, undefined, undefined];

  const { data: balance } = useEtherSWR({
    args: [[escrow, 'balance']],
    abi: F2_SIMPLE_ESCROW,
  });

  const decimals = market.underlying.decimals;

  return {
    escrow,
    deposits: balance ? getBnToNumber(balance[0], decimals) : 0,
    bnDeposits: balance ? balance[0] : BigNumber.from('0'),
    creditLimit: creditLimit ? getBnToNumber(creditLimit) : 0,
    bnCreditLimit: creditLimit ? creditLimit : zero,
    withdrawalLimit: withdrawalLimit ? getBnToNumber(withdrawalLimit, decimals) : 0,
    bnWithdrawalLimit: withdrawalLimit ? withdrawalLimit : zero,
  }
}