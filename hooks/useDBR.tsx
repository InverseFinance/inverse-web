import { BALANCER_VAULT_ABI, F2_ESCROW_ABI } from "@app/config/abis";
import { F2Market, SWR } from "@app/types"
import { getBnToNumber, getNumberToBn } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks"
import { getToken, TOKENS } from "@app/variables/tokens";
import { BigNumber } from "ethers/lib/ethers";
import useEtherSWR from "./useEtherSWR"
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from "./useCustomSWR";
import { f2CalcNewHealth } from "@app/util/f2";
import { BURN_ADDRESS, ONE_DAY_MS } from "@app/config/constants";
import { parseUnits } from "@ethersproject/units";

const { DBR, DBR_AIRDROP, F2_MARKETS, F2_ORACLE, DOLA } = getNetworkConfigConstants();

const zero = BigNumber.from('0');
const oneYear = ONE_DAY_MS * 365;

export const useAccountDBR = (
  account: string | undefined | null,
  previewDebt?: number,
  deltaDBR = 0
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
  bnBalance: BigNumber,
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
  const dailyDebtAccrual = Math.max(0, (ONE_DAY_MS * _debt / oneYear));
  const balanceWithDelta = signedBalance + deltaDBR;
  // at current debt accrual rate, when will DBR be depleted?
  const dbrNbDaysExpiry = dailyDebtAccrual ? balanceWithDelta <= 0 ? 0 : balanceWithDelta / dailyDebtAccrual : 0;
  const dbrExpiryDate = !_debt ? null : (+new Date() + dbrNbDaysExpiry * ONE_DAY_MS);
  const dbrDepletionPerc = dbrNbDaysExpiry / 365 * 100;

  return {
    bnBalance: data ? data[0] : BigNumber.from('0'),
    balance,
    debt: _debt,
    interests,
    signedBalance: balanceWithDelta,
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
  const { data: apiData } = useCustomSWR(`/api/f2/fixed-markets?v8`, fetcher);
  const _markets = Array.isArray(marketOrList) ? marketOrList : !!marketOrList ? [marketOrList] : [];

  const cachedMarkets = (apiData?.markets || F2_MARKETS)
    .filter(m => !!marketOrList ? _markets.includes(m.name) : true);

  const markets = F2_MARKETS
    .filter(m => !!marketOrList ? _markets.includes(m.name) : true)
    .map(m => {
      return {
        ...m,
        underlying: TOKENS[m.collateral],
      }
    });

  const nbMarkets = markets.length;

  const d = new Date();
  const dayIndexUtc = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / ONE_DAY_MS);

  const { data, error } = useEtherSWR([
    ...markets.map(m => {
      return [F2_ORACLE, 'viewPrice', m.collateral, getNumberToBn(m.collateralFactor, 4)]
    }),
    ...markets.map(m => {
      return [m.address, 'collateralFactorBps']
    }),
    ...markets.map(m => {
      return [m.address, 'totalDebt']
    }),
    ...markets.map(m => {
      return [m.address, 'borrowController']
    }),
    ...markets.map(m => {
      return [DOLA, 'balanceOf', m.address]
    }),
    ...markets.map(m => {
      return [m.address, 'borrowPaused']
    }),
  ]);

  const { data: limits } = useEtherSWR([
    ...markets.map((m, i) => {
      const bc = data ? data[i + 3 * nbMarkets] : BURN_ADDRESS;
      const noBorrowController = bc === BURN_ADDRESS;
      return data && !noBorrowController ? [bc, 'dailyLimits', m.address] : [];
    }),
    ...markets.map((m, i) => {
      const bc = data ? data[i + 3 * nbMarkets] : BURN_ADDRESS;
      const noBorrowController = bc === BURN_ADDRESS;
      return data && !noBorrowController ? [bc, 'dailyBorrows', m.address, dayIndexUtc] : [];
    }),
  ]);

  return {
    markets: markets.map((m, i) => {
      const dailyLimit = limits ? getBnToNumber(limits[i]) : cachedMarkets[i]?.dailyLimit ?? 0;
      const dailyBorrows = limits ? getBnToNumber(limits[i + nbMarkets]) : cachedMarkets[i]?.dailyBorrows ?? 0;
      const dolaLiquidity = data ? getBnToNumber(data[i + 4 * nbMarkets]) : cachedMarkets[i]?.dolaLiquidity ?? 0;
      const borrowPaused = data ? data[i + 5 * nbMarkets] : cachedMarkets[i]?.borrowPaused ?? false;
      const leftToBorrow = borrowPaused ? 0 : limits ? dailyLimit === 0 ? dolaLiquidity : Math.min(dailyLimit - dailyBorrows, dolaLiquidity) : cachedMarkets[i]?.leftToBorrow ?? 0;

      return {
        ...m,
        ...cachedMarkets[i],        
        price: data ? getBnToNumber(data[i], (36 - m.underlying.decimals)) : cachedMarkets[i]?.price ?? 0,
        collateralFactor: data ? getBnToNumber(data[i + nbMarkets], 4) : cachedMarkets[i]?.collateralFactor ?? 0,
        totalDebt: data ? getBnToNumber(data[i + 2 * nbMarkets]) : cachedMarkets[i]?.totalDebt ?? 0,
        bnDolaLiquidity: data ? data[i + 4 * nbMarkets] : cachedMarkets[i]?.bnDolaLiquidity ?? 0,
        dolaLiquidity,
        dailyLimit,
        dailyBorrows,
        leftToBorrow,
        bnLeftToBorrow: getNumberToBn(leftToBorrow),
        borrowPaused,
      }
    }),
  }
}

type AccountDBRMarket = F2Market & {
  account: string | undefined | null
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
  bnCollateralBalance: BigNumber
  collateralBalance: number
  hasDebt: boolean
  liquidationPrice: number | null
  liquidatableDebtBn: BigNumber
  liquidatableDebt: number
  seizableWorth: number,
  seizable: number,
}

export const useAccountDBRMarket = (
  market: F2Market,
  account: string,
  isUseNativeCoin = false,
): AccountDBRMarket => {
  const { data: accountMarketData, error } = useEtherSWR([
    [market.address, 'escrows', account],
    [market.address, 'getCreditLimit', account],
    [market.address, 'getWithdrawalLimit', account],
    [market.address, 'debts', account],
  ]);

  const { data: balances } = useEtherSWR([
    [market.collateral, 'balanceOf', account],
    ['getBalance', account, 'latest'],
  ]);

  const [escrow, bnCreditLimit, bnWithdrawalLimit, bnDebt] = accountMarketData || [undefined, zero, zero, zero];
  const bnCollateralBalance: BigNumber = balances ? isUseNativeCoin ? balances[1] : balances[0] : zero;
  const creditLimit = bnCreditLimit ? getBnToNumber(bnCreditLimit) : 0;

  const { data: escrowData } = useEtherSWR({
    args: [[escrow, 'balance']],
    abi: F2_ESCROW_ABI,
  });
  const bnDeposits = (escrowData && escrow ? escrowData[0] : zero);

  const decimals = market.underlying.decimals;

  const { deposits, withdrawalLimit } = {
    deposits: bnDeposits ? getBnToNumber(bnDeposits, decimals) : 0,
    withdrawalLimit: bnWithdrawalLimit ? getBnToNumber(bnWithdrawalLimit, decimals) : 0,
  }

  const hasDebt = !!deposits && !!withdrawalLimit && deposits > 0 && deposits !== withdrawalLimit;
  const debt = bnDebt ? getBnToNumber(bnDebt) : 0;
  const { newPerc: perc, newCreditLeft: creditLeft, newLiquidationPrice: liquidationPrice } = f2CalcNewHealth(market, deposits, debt);

  const liquidatableDebt = creditLimit >= debt ? 0 : debt * market.liquidationFactor;
  const liquidatableDebtBn = getNumberToBn(liquidatableDebt);
  const seizableWorth = liquidatableDebt + market.liquidationIncentive * liquidatableDebt;

  return {
    ...market,
    account,
    escrow,
    deposits,
    bnDeposits,
    creditLimit,
    bnCreditLimit,
    withdrawalLimit,
    bnWithdrawalLimit,
    debt,
    bnDebt,
    creditLeft,
    perc,
    hasDebt,
    liquidationPrice,
    bnCollateralBalance,
    collateralBalance: (bnCollateralBalance ? getBnToNumber(bnCollateralBalance, decimals) : 0),
    liquidatableDebtBn,
    liquidatableDebt: liquidatableDebtBn ? getBnToNumber(liquidatableDebtBn) : 0,
    seizableWorth,
    seizable: seizableWorth / market.price,
  }
}

export const useAccountF2Markets = (
  markets: F2Market[],
  account: string,
): AccountDBRMarket[] => {
  return markets.map(m => {
    const accountData = useAccountDBRMarket(m, account);
    return { ...m, ...accountData }
  });
}

export const useDBRPriceLive = (): { price: number | undefined } => {
  const { data } = useEtherSWR({
    args: [
      [
        // vault
        '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
        'getPoolTokens',
        // poolId          
        '0x445494f823f3483ee62d854ebc9f58d5b9972a25000200000000000000000415',
      ],
    ],
    abi: BALANCER_VAULT_ABI,
  });

  const price = data && data[0] ?
    getBnToNumber(data[0][1][0]) / getBnToNumber(data[0][1][1]) : undefined;

  return {
    price,
  }
}

export const useDBRPrice = (): { price: number } => {
  const { data: apiData } = useCustomSWR(`/api/dbr`, fetcher);
  const { price: livePrice } = useDBRPriceLive();

  return {
    price: livePrice ?? (apiData?.price || 0.04),
  }
}

export const useDBR = (): {
  price: number,
  timestamp: number,
  totalSupply: number,
  totalDueTokensAccrued: number,
  operator: string,
} => {
  const { data: apiData } = useCustomSWR(`/api/dbr?withExtra=true`, fetcher);
  const { price: livePrice } = useDBRPriceLive();
  const { data: extraData } = useEtherSWR([
    [DBR, 'totalSupply'],
    [DBR, 'totalDueTokensAccrued'],
    [DBR, 'operator'],
  ]);

  return {
    timestamp: livePrice && extraData ? +(new Date()) : apiData?.timestamp,
    price: livePrice ?? (apiData?.price || 0.04),
    totalSupply: extraData ? getBnToNumber(extraData[0]) : (apiData?.totalSupply || 0),
    totalDueTokensAccrued: extraData ? getBnToNumber(extraData[1]) : (apiData?.totalDueTokensAccrued || 0),
    operator: extraData ? extraData[2] : apiData?.operator || '0x926dF14a23BE491164dCF93f4c468A50ef659D5B',
  }
}

export const useBorrowLimits = (market: F2Market) => {
  const d = new Date();
  const dayIndexUtc = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / ONE_DAY_MS);

  const noBorrowController = market.borrowController === BURN_ADDRESS;

  const dataToGet = noBorrowController ? [
    [DOLA, 'balanceOf', market.address],
  ] : [
    [DOLA, 'balanceOf', market.address],
    [market.borrowController, 'dailyLimits', market.address],
    [market.borrowController, 'dailyBorrows', market.address, dayIndexUtc],
  ];

  const { data } = useEtherSWR(dataToGet);

  const dolaLiquidity = data ? getBnToNumber(data[0]) : 0;
  const dailyLimit = !noBorrowController && data ? getBnToNumber(data[1]) : 0;
  const dailyBorrows = !noBorrowController && data ? getBnToNumber(data[2]) : 0;
  const leftToBorrow = data && dailyLimit !== 0 ? dailyLimit - dailyBorrows : dolaLiquidity;

  return {
    dailyLimit,
    dailyBorrows,
    leftToBorrow,
    dolaLiquidity,
  }
}

export const useDBRReplenishmentPrice = (): SWR & {
  replenishmentPrice: number,
} => {
  const { data, error } = useEtherSWR([
    DBR, 'replenishmentPriceBps',
  ]);

  return {
    replenishmentPrice: data ? getBnToNumber(data, 4) : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRNeeded = (borrowAmount: number, period: number, iterations = 8): SWR & {
  dolaNeeded: number,
  dbrNeeded: number,
} => {
  const { data, error } = useEtherSWR([
    DBR, 'approximateDolaAndDbrNeeded', getNumberToBn(borrowAmount), period, iterations
  ]);

  return {
    dolaNeeded: data ? getBnToNumber(data[0]) : 0,
    dbrNeeded: data ? getBnToNumber(data[1]) : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useCheckDBRAirdrop = (account: string): SWR & {
  isEligible: boolean,
  hasClaimed: boolean,
  amount: number,
  amountString: string,
  airdropData: { [key: string]: string },
  claimer: string,
} => {
  const { data: airdropData, error: airdropDataErr } = useCustomSWR('/assets/firm/dbr/airdrop.json', fetcher);
  const { data: hasClaimed, error: hasClaimErr } = useEtherSWR([
    DBR_AIRDROP, 'hasClaimed', account, '0'
  ]);

  const asArray = airdropData ? Object.entries(airdropData) : [];

  const amounts = asArray.filter(a => a[0].toLowerCase() === account?.toLowerCase());
  amounts.sort((a, b) => a[1] > b[1] ? -1 : 1);
  const isEligible = amounts?.length > 0;

  const claimer = amounts?.length ? amounts[0][0] : account;
  const amountString = amounts?.length ? amounts[0][1] : '0';
  const amount = isEligible && amounts?.length ? getBnToNumber(parseUnits(amountString, 0)) : 0;

  return {
    isEligible,
    hasClaimed,
    claimer,
    amount,
    amountString,
    airdropData,
    isLoading: !airdropData,
    isError: !!airdropDataErr || !!hasClaimErr,
  }
}