import { F2_SIMPLE_ESCROW } from "@app/config/abis";
import { F2Market, SWR } from "@app/types"
import { getBnToNumber, getNumberToBn } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks"
import { getToken, TOKENS } from "@app/variables/tokens";
import { BigNumber } from "ethers/lib/ethers";
import useEtherSWR from "./useEtherSWR"
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from "./useCustomSWR";
import { f2CalcNewHealth } from "@app/util/f2";
import { BURN_ADDRESS } from "@app/config/constants";

const { DBR, F2_MARKETS, F2_ORACLE, DOLA } = getNetworkConfigConstants();

const zero = BigNumber.from('0');
const oneDay = 86400000;
const oneYear = oneDay * 365;

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
  const balanceWithDelta = signedBalance+deltaDBR;
  // at current debt accrual rate, when will DBR be depleted?
  const dbrNbDaysExpiry = dailyDebtAccrual ? balanceWithDelta <= 0 ? 0 : balanceWithDelta / dailyDebtAccrual : 0;
  const dbrExpiryDate = !_debt ? null : (+new Date() + dbrNbDaysExpiry * oneDay);
  const dbrDepletionPerc = dbrNbDaysExpiry / 365 * 100;

  return {
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
  const { data: apiData } = useCustomSWR(`/api/f2/fixed-markets?v5`, fetcher);
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
  const dayIndexUtc = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0) / oneDay);

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
      const bc = data ? data[i+3*nbMarkets] : BURN_ADDRESS;
      const noBorrowController = bc === BURN_ADDRESS;
      return data && !noBorrowController ? [bc, 'dailyLimits', m.address] : [];
    }),
    ...markets.map((m, i) => {
      const bc = data ? data[i+3*nbMarkets] : BURN_ADDRESS;
      const noBorrowController = bc === BURN_ADDRESS;
      return data && !noBorrowController ? [bc, 'dailyBorrows', m.address, dayIndexUtc] : [];
    }),
  ]);

  return {
    markets: markets.map((m, i) => {
      const dailyLimit = limits ? getBnToNumber(limits[i]) : cachedMarkets[i]?.dailyLimit ?? 0;
      const dailyBorrows = limits ? getBnToNumber(limits[i+nbMarkets]) : cachedMarkets[i]?.dailyBorrows ?? 0;
      const dolaLiquidity = data ? getBnToNumber(data[i+4*nbMarkets]) : cachedMarkets[i]?.dolaLiquidity ?? 0;
      const borrowPaused =  data ? data[i+5*nbMarkets] : cachedMarkets[i]?.borrowPaused ?? false;
      const leftToBorrow = borrowPaused ? 0 : limits ? dailyLimit === 0 ? dolaLiquidity : Math.min(dailyLimit - dailyBorrows, dolaLiquidity) : cachedMarkets[i]?.leftToBorrow ?? 0;
      
      return {
        ...m,
        ...cachedMarkets[i],
        supplyApy: 0,
        price: data ? getBnToNumber(data[i]) : cachedMarkets[i]?.price ?? 0,
        collateralFactor: data ? getBnToNumber(data[i+nbMarkets], 4) : cachedMarkets[i]?.collateralFactor ?? 0,
        totalDebt: data ? getBnToNumber(data[i+2*nbMarkets]) : cachedMarkets[i]?.totalDebt ?? 0,
        bnDolaLiquidity: data ? data[i+4*nbMarkets] : cachedMarkets[i]?.bnDolaLiquidity ?? 0,
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
): AccountDBRMarket => {
  const { data: accountMarketData, error } = useEtherSWR([
    [market.address, 'escrows', account],
    [market.address, 'getCreditLimit', account],
    [market.address, 'getWithdrawalLimit', account],
    [market.address, 'debts', account],
    [market.address, 'getLiquidatableDebt', account],
  ]);

  const { data: balances } = useEtherSWR([
    [market.collateral, 'balanceOf', account],
  ]);

  const [escrow, bnCreditLimit, bnWithdrawalLimit, bnDebt, liquidatableDebtBn] = accountMarketData || [undefined, zero, zero, zero];
  const [bnCollateralBalance]: BigNumber[] = balances || [zero];

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
  const { newPerc: perc, newCreditLeft: creditLeft, newLiquidationPrice: liquidationPrice } = f2CalcNewHealth(market, deposits, debt);  

  const liquidatableDebt = liquidatableDebtBn ? getBnToNumber(liquidatableDebtBn) : 0;
  const seizableWorth = liquidatableDebt + market.liquidationIncentive * liquidatableDebt;

  return {
    ...market,
    account,
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

export const useDBRPrice = (): { price: number } => {
  const weth = getToken(TOKENS, 'WETH')
  // const { data } = useEtherSWR({
  //   args: [      
  //       [
  //         // sushi
  //         '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  //         'getAmountsOut',
  //         '1000000000000000000',
  //         [weth.address, DBR],
  //       ],      
  //   ],
  //   abi: ['function getAmountsOut(uint256, address[]) public view returns (uint256[])']
  // })
  // const { data: ethPrice } = useEtherSWR({
  //   args: [
  //     ['0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e', 'latestAnswer'],
  //   ],
  //   abi: ['function latestAnswer() public view returns (uint256)'],
  // });
  // const out = data && data[0] ? getBnToNumber(data[0][1]) : 0;
  // use coingecko as fallback when ready
  return {
    price: 0.05,//ethPrice ? getBnToNumber(ethPrice[0], 8) / out : 0.05
  }
}

export const useBorrowLimits = (market: F2Market) => {
  const d = new Date();
  const dayIndexUtc = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0) / oneDay);

  const noBorrowController = market.borrowController === BURN_ADDRESS;

  const dataToGet = noBorrowController ? [
    [DOLA, 'balanceOf', market.address],
  ]: [
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