import { F2_SIMPLE_ESCROW } from "@app/config/abis";
import { F2Market, SWR } from "@app/types"
import { getBnToNumber } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks"
import { TOKENS } from "@app/variables/tokens";
import { BigNumber } from "ethers/lib/ethers";
import useEtherSWR from "./useEtherSWR"

const { DBR, F2_MARKETS, F2_ORACLE, DOLA } = getNetworkConfigConstants();

const zero = BigNumber.from('0');
const oneDay = 86400000;
const oneYear = oneDay * 365;

export const useAccountDBR = (
  account: string | undefined | null,
  previewDebt?: number,
): SWR & {
  balance: number,
  debt: number,
  interests: number,
  signedBalance: number,
  dailyDebtAccrual: number,
  dbrNbDaysExpiry: number,
  dbrExpiryDate: number | null,
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
  const _debt = previewDebt ?? debt;
  const dailyDebtAccrual = (oneDay * _debt / oneYear);
  // at current debt accrual rate, when will DBR be depleted?
  const dbrNbDaysExpiry = dailyDebtAccrual ? balance / dailyDebtAccrual : 0;
  const dbrExpiryDate = !_debt ? null : (+new Date() + dbrNbDaysExpiry * oneDay);
  const dbrDepletionPerc = dbrNbDaysExpiry / 365 * 100;

  return {
    balance,
    debt: _debt,
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
    .filter(m => !!marketOrList ? _markets.includes(m.name) : true)
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

export const useAccountDBRMarket = (
  market: F2Market,
  account: string,
): {
  escrow: string | undefined
  deposits: number
  bnDeposits: BigNumber
  creditLimit: number
  bnCreditLimit: BigNumber
  withdrawalLimit: number
  bnWithdrawalLimit: BigNumber
  creditLeft: number
  perc: number
  debt: number
  bnDebt: BigNumber
  bnDola: BigNumber
  dola: number
  hasDebt: boolean
  liquidationPrice: number | null
} => {
  const { data: accountMarketData, error } = useEtherSWR([
    [market.address, 'escrows', account],
    [market.address, 'getCreditLimit', account],
    [market.address, 'getWithdrawalLimit', account],
    [market.address, 'debts', account],
  ]);

  const { data: dolaData } = useEtherSWR([
    [DOLA, 'balanceOf', market.address],
  ]);

  const [escrow, bnCreditLimit, bnWithdrawalLimit, bnDebt] = accountMarketData || [undefined, zero, zero, zero];
  const [bnDola] = dolaData || [zero];

  const { data: escrowData } = useEtherSWR({
    args: [[escrow, 'balance']],
    abi: F2_SIMPLE_ESCROW,
  });
  const bnDeposits = (escrowData ? escrowData[0] : zero);
  
  const decimals = market.underlying.decimals;

  const { deposits, withdrawalLimit } = {
    deposits: bnDeposits ? getBnToNumber(bnDeposits, decimals) : 0,
    withdrawalLimit: bnWithdrawalLimit ? getBnToNumber(bnWithdrawalLimit, decimals) : 0,
  }

  const hasDebt = !!deposits && !!withdrawalLimit && deposits > 0 && deposits !== withdrawalLimit;
  const debt = bnDebt ? getBnToNumber(bnDebt) : 0;
  const perc = Math.max(hasDebt ? withdrawalLimit / deposits * 100 : deposits ? 100 : 0, 0);

  const creditLeft = withdrawalLimit * market?.price * market.collateralFactor / 100;
  const liquidationPrice = hasDebt ? debt / (market.collateralFactor / 100 * deposits) : null;

  return {
    escrow,
    deposits,
    bnDeposits,
    creditLimit: bnCreditLimit ? getBnToNumber(bnCreditLimit) : 0,
    bnCreditLimit,
    withdrawalLimit,
    bnWithdrawalLimit,
    debt,
    bnDebt,
    creditLeft,
    perc,
    hasDebt,
    liquidationPrice,
    bnDola,
    dola: bnDola ? getBnToNumber(bnDola) : 0,
  }
}

export const useAccountF2Markets = (
  markets: F2Market[],
  account: string,
): {
  escrow: string | undefined
  deposits: number
  bnDeposits: BigNumber
  creditLimit: number
  bnCreditLimit: BigNumber
  withdrawalLimit: number
  bnWithdrawalLimit: BigNumber
  creditLeft: number
  perc: number
  debt: number
  bnDebt: BigNumber
  hasDebt: boolean
  liquidationPrice: number | null
}[] => {
  return markets.map(m => {
    const accountData =  useAccountDBRMarket(m, account);
    return { ...m, ...accountData }
  });
}

export const useDBRPrice = (): { price: number } => {
  return {
    price: 0.015
  }
}