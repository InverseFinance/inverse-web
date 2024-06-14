import { BALANCER_VAULT_ABI, F2_ESCROW_ABI } from "@app/config/abis";
import { AccountDBRMarket, CoingeckoHistoricalData, F2Market, SWR } from "@app/types"
import { getBnToNumber, getNumberToBn } from "@app/util/markets";
import { getNetworkConfigConstants } from "@app/util/networks"
import { TOKENS } from "@app/variables/tokens";
import { BigNumber } from "ethers/lib/ethers";
import useEtherSWR from "./useEtherSWR"
import { fetcher, fetcher60sectimeout } from '@app/util/web3'
import { useCacheFirstSWR, useCustomSWR } from "./useCustomSWR";
import { f2CalcNewHealth, f2approxDbrAndDolaNeeded } from "@app/util/f2";
import { BURN_ADDRESS, ONE_DAY_MS, ONE_DAY_SECS } from "@app/config/constants";
import { parseUnits } from "@ethersproject/units";
import useSWR from "swr";
import { useWeb3React } from "@web3-react/core";
import { useDOLAPriceLive } from "./usePrices";
import { timestampToUTC } from "@app/util/misc";
import { useState } from "react";

const { DBR, DBR_AIRDROP, F2_MARKETS, F2_ORACLE, DOLA, DBR_DISTRIBUTOR, F2_HELPER, F2_ALE } = getNetworkConfigConstants();

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
  monthlyDebtAccrual: number,
  dbrNbDaysExpiry: number,
  dbrExpiryDate: number | null,
  dbrDepletionPerc: number,
  bnDebt: BigNumber,
  bnBalance: BigNumber,
  hasDbrV1NewBorrowIssue: boolean,
  needsRechargeSoon: boolean,
} => {
  const { data, error } = useEtherSWR([
    [DBR, 'balanceOf', account],
    [DBR, 'debts', account],
    [DBR, 'dueTokensAccrued', account],
    [DBR, 'signedBalanceOf', account],
    // [DBR, 'lastUpdated', account],
  ]);
  // const blockTimestamp = useBlockTimestamp('latest');

  const [balance, debt, interests, signedBalance] = (data || [zero, zero, zero, zero])
    .map(v => getBnToNumber(v));
  // const [balance, allowance, debt, interests, signedBalance] = [100, 0, 5000, 0, 2500];  
  // const lastUpdate = data ? getBnToNumber(data[4], 0) * 1000 : 0;  

  // interests are not auto-compounded
  const _debt = previewDebt ?? debt;
  const dailyDebtAccrual = Math.max(0, (ONE_DAY_MS * _debt / oneYear));
  const monthlyDebtAccrual = dailyDebtAccrual * 365 / 12;
  const balanceWithDelta = signedBalance + deltaDBR;
  // at current debt accrual rate, when will DBR be depleted?
  const dbrNbDaysExpiry = dailyDebtAccrual ? balanceWithDelta <= 0 ? 0 : balanceWithDelta / dailyDebtAccrual : 0;
  const dbrExpiryDate = !_debt ? null : (+new Date() + dbrNbDaysExpiry * ONE_DAY_MS);
  const dbrDepletionPerc = dbrNbDaysExpiry / 365 * 100;

  // dbr v1 edge issue
  // const hasDbrV1NewBorrowIssue = lastUpdate > 0 && debt === 0 && lastUpdate !== (blockTimestamp?.timestamp||0);

  const hasDebt = monthlyDebtAccrual !== 0;
  const needsRechargeSoon = dbrNbDaysExpiry <= 30 && hasDebt;

  return {
    hasDbrV1NewBorrowIssue: false,
    needsRechargeSoon,
    bnBalance: data ? data[0] : BigNumber.from('0'),
    balance,
    debt: _debt,
    interests,
    signedBalance: balanceWithDelta,
    dailyDebtAccrual,
    monthlyDebtAccrual,
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
  isLoading: boolean
} => {
  const { data: apiData, isLoading } = useCacheFirstSWR(`/api/f2/fixed-markets?v12`);
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
      return [F2_ORACLE, 'viewPrice', m.collateral, getNumberToBn(m.collateralFactor, 4)];
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
    ...markets.map(m => {
      return [F2_ALE, 'markets', m.address]
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
    ...markets.map((m, i) => {
      const bc = data ? data[i + 3 * nbMarkets] : BURN_ADDRESS;
      const noBorrowController = bc === BURN_ADDRESS;
      return data && !noBorrowController ? [bc, 'minDebts', m.address] : [];
    }),
  ]);

  return {
    isLoading,
    markets: markets.map((m, i) => {
      const dailyLimit = limits ? getBnToNumber(limits[i]) : cachedMarkets[i]?.dailyLimit ?? 0;
      const dailyBorrows = limits ? getBnToNumber(limits[i + nbMarkets]) : cachedMarkets[i]?.dailyBorrows ?? 0;
      const minDebt = limits ? getBnToNumber(limits[i + 2 * nbMarkets]) : cachedMarkets[i]?.minDebt ?? 0;
      const dolaLiquidity = data ? getBnToNumber(data[i + 4 * nbMarkets]) : cachedMarkets[i]?.dolaLiquidity ?? 0;
      const borrowPaused = data ? data[i + 5 * nbMarkets] : cachedMarkets[i]?.borrowPaused ?? false;
      const leftToBorrow = borrowPaused ? 0 : limits ? dailyLimit === 0 ? dolaLiquidity : Math.min(dailyLimit - dailyBorrows, dolaLiquidity) : cachedMarkets[i]?.leftToBorrow ?? 0;
      const aleData = data ? data[i + 6 * nbMarkets] : [BURN_ADDRESS, BURN_ADDRESS, BURN_ADDRESS];
      // only those markets have a decent routing at the moment
      const hasAleFeat = aleData[0] !== BURN_ADDRESS;

      return {
        ...m,
        ...cachedMarkets[i],
        price: data && data[i] ? getBnToNumber(data[i], (36 - m.underlying.decimals)) : cachedMarkets[i]?.price ?? 0,
        collateralFactor: data ? getBnToNumber(data[i + nbMarkets], 4) : cachedMarkets[i]?.collateralFactor ?? 0,
        totalDebt: data ? getBnToNumber(data[i + 2 * nbMarkets]) : cachedMarkets[i]?.totalDebt ?? 0,
        bnDolaLiquidity: data ? data[i + 4 * nbMarkets] : cachedMarkets[i]?.bnDolaLiquidity ?? 0,
        dolaLiquidity,
        dailyLimit,
        dailyBorrows,
        leftToBorrow,
        minDebt,
        bnLeftToBorrow: getNumberToBn(leftToBorrow),
        borrowPaused,
        hasAleFeat,
        aleData: { buySellToken: aleData[0], collateral: aleData[1], helper: aleData[2] },
      }
    }),
  }
}

export const useAccountDBRMarket = (
  market: F2Market,
  account: string,
  isUseNativeCoin = false,
): AccountDBRMarket => {
  const { data: escrow } = useEtherSWR([market.address, 'escrows', account]);
  const { data: accountMarketData } = useEtherSWR(
    !escrow || escrow === BURN_ADDRESS ? [] : [
      [market.address, 'getWithdrawalLimit', account],
      [market.address, 'debts', account],
    ]
  );

  // inv does not have a valid feed, call will revert
  const { data: accountMarketDataWithValidFeed } = useEtherSWR(
    !escrow || escrow === BURN_ADDRESS ? [] : [
      [market.address, 'getCreditLimit', account],
    ]
  );

  const { data: balances } = useEtherSWR([
    isUseNativeCoin ? ['getBalance', account, 'latest'] : [market.collateral, 'balanceOf', account],
  ]);

  const [bnWithdrawalLimit, bnDebt] = accountMarketData || [zero, zero];
  const [bnCreditLimit] = accountMarketDataWithValidFeed || [zero];
  const bnCollateralBalance: BigNumber = balances ? balances[0] : zero;
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

  const { data: underlyingExRateData } = useEtherSWR({
    args: market.name === 'st-yCRV' ?
      [[market.collateral, 'pricePerShare']] :
      market.isERC4626Collateral ?
        [[market.collateral, 'convertToAssets', '1000000000000000000']]
        : [],
    abi: ['function pricePerShare() public view returns (uint)', 'function convertToAssets(uint) public view returns (uint)'],
  });
  const underlyingExRate = underlyingExRateData?.length ? getBnToNumber(underlyingExRateData[0]) : undefined;

  return {
    ...market,
    account,
    escrow,
    deposits,
    bnDeposits,
    depositsUsd: deposits * market.price,
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
    underlyingExRate,
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

export const useDBRBalancePrice = (): { price: number | undefined } => {
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

export const useDBRPriceLive = (): { priceUsd: number | undefined, priceDola: number | undefined } => {
  const { price: dolaPrice } = useDOLAPriceLive();
  const { data } = useEtherSWR({
    args: [
      ['0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a', 'price_oracle', '0'],
    ],
    abi: [
      'function price_oracle(uint) public view returns(uint)',
    ],
  });

  return {
    priceUsd: data && data[0] && !!dolaPrice ? getBnToNumber(data[0]) * dolaPrice : undefined,
    priceDola: data && data[0] ? getBnToNumber(data[0]) : undefined,
  }
}

export const useDBRSwapPrice = (dolaWorthOfDbrAsk = '1000'): { price: number | undefined, isLoading: boolean } => {
  const _ask = dolaWorthOfDbrAsk?.toString() === '0' ? '1000' : dolaWorthOfDbrAsk;
  const { data, error } = useEtherSWR({
    args: [
      ['0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a', 'get_dy', 1, 0, parseUnits(_ask)],
    ],
    abi: ['function get_dy(uint i, uint j, uint dx) public view returns(uint)'],
  });

  const price = data && data[0] ? 1 / (getBnToNumber(data[0]) / parseFloat(_ask)) : undefined;

  return {
    price,
    isLoading: !data && !error,
  }
}

export const useTriCryptoSwap = (amountToSell: number, srcIdx = 1, dstIdx = 0): { amountOut: number | null, price: number | null, isLoading: boolean, isError: boolean } => {
  const { data, error } = useEtherSWR({
    args: [
      ['0xC7DE47b9Ca2Fc753D6a2F167D8b3e19c6D18b19a', 'get_dy', srcIdx, dstIdx, parseUnits(amountToSell.toString(), 18)],
    ],
    abi: ['function get_dy(uint i, uint j, uint dx) public view returns(uint)'],
  });

  return {
    amountOut: data ? getBnToNumber(data[0]) : null,
    price: data ? getBnToNumber(data[0]) / amountToSell : null,
    isLoading: !error && !data,
    isError: !!error,
  }
}

export const useDBRPrice = (): { priceUsd: number, priceDola: number | undefined } => {
  const { data: apiData } = useCustomSWR(`/api/dbr`, fetcher);
  const { priceUsd: livePriceUsd, priceDola: livePriceDola } = useDBRPriceLive();

  return {
    priceUsd: livePriceUsd ?? (apiData?.priceUsd || 0),
    priceDola: livePriceDola ?? (apiData?.priceDola || 0),
  }
}

export const useDBR = (): {
  priceUsd: number,
  priceDola: number,
  timestamp: number,
  totalSupply: number,
  totalDueTokensAccrued: number,
  rewardRate: number,
  yearlyRewardRate: number,
  minRewardRate: number,
  minYearlyRewardRate: number,
  maxRewardRate: number,
  maxYearlyRewardRate: number,
  operator: string,
  historicalData: CoingeckoHistoricalData,
  isLoading: boolean,
} => {
  const { data: apiData, isLoading } = useCustomSWR(`/api/dbr?v=2&withExtra=true`, fetcher);
  const { priceUsd: livePrice, priceDola } = useDBRPriceLive();

  const { data: extraData } = useEtherSWR([
    [DBR, 'totalSupply'],
    [DBR, 'totalDueTokensAccrued'],
    [DBR, 'operator'],
    [DBR_DISTRIBUTOR, 'rewardRate'],
    [DBR_DISTRIBUTOR, 'minRewardRate'],
    [DBR_DISTRIBUTOR, 'maxRewardRate'],
  ]);

  const rewardRate = extraData ? getBnToNumber(extraData[3]) : apiData?.rewardRate || 0;
  const yearlyRewardRate = rewardRate * ONE_DAY_SECS * 365;
  const minRewardRate = extraData ? getBnToNumber(extraData[4]) : apiData?.minRewardRate || 0;
  const minYearlyRewardRate = minRewardRate * ONE_DAY_SECS * 365;
  const maxRewardRate = extraData ? getBnToNumber(extraData[5]) : apiData?.maxRewardRate || 0;
  const maxYearlyRewardRate = maxRewardRate * ONE_DAY_SECS * 365;

  return {
    timestamp: livePrice && extraData ? +(new Date()) : apiData?.timestamp,
    priceUsd: livePrice ?? (apiData?.priceUsd || 0.04),
    priceDola: priceDola ?? (apiData?.priceDola || 0.04),
    totalSupply: extraData ? getBnToNumber(extraData[0]) : (apiData?.totalSupply || 0),
    totalDueTokensAccrued: extraData ? getBnToNumber(extraData[1]) : (apiData?.totalDueTokensAccrued || 0),
    operator: extraData ? extraData[2] : apiData?.operator || '0x926dF14a23BE491164dCF93f4c468A50ef659D5B',
    historicalData: apiData?.historicalData,
    rewardRate,
    yearlyRewardRate,
    minRewardRate,
    maxRewardRate,
    maxYearlyRewardRate,
    minYearlyRewardRate,
    isLoading: !!isLoading,
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
    [market.address, 'borrowPaused'],
  ];

  const { data, error } = useEtherSWR(dataToGet);

  const dolaLiquidity = data ? getBnToNumber(data[0]) : 0;
  const dailyLimit = !noBorrowController && data ? getBnToNumber(data[1]) : 0;
  const dailyBorrows = !noBorrowController && data ? getBnToNumber(data[2]) : 0;
  const borrowPaused = data ? data[3] : market.borrowPaused ?? false;
  const leftToBorrow = borrowPaused ? 0 : !dailyLimit ? dolaLiquidity : Math.min(dailyLimit - dailyBorrows, dolaLiquidity);

  return {
    dailyLimit,
    dailyBorrows,
    leftToBorrow,
    dolaLiquidity,
    isLoading: !data && !error,
    isError: !!error,
  }
}

export const useDBRReplenishmentPrice = (): SWR & {
  replenishmentPrice: number,
  replenishmentDailyRate: number,
} => {
  const { data, error } = useEtherSWR([
    DBR, 'replenishmentPriceBps',
  ]);

  const replenishmentPrice = data ? getBnToNumber(data, 4) : 0;

  return {
    replenishmentPrice,
    replenishmentDailyRate: replenishmentPrice * 100 / 365,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRNeeded = (borrowAmount: string, durationDays: number, iterations?: number): SWR & {
  dolaNeeded: number,
  dbrNeeded: number,
} => {
  const { provider } = useWeb3React();

  const { data, error } = useSWR(`dbr-helper-approx-${borrowAmount}-${durationDays}-${iterations}`, async () => {
    if (!borrowAmount) {
      return undefined;
    }
    return await f2approxDbrAndDolaNeeded(provider?.getSigner(), parseUnits(borrowAmount), '0', durationDays, 'curve-v2', iterations);
  }, {
    refreshInterval: 100000,
  });

  return {
    ...data,
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
  isLoading: boolean,
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

export const useDBRBalanceHisto = (account: string): { evolution: any, currentBalance: number | null, isLoading: boolean } => {
  const { account: connectedUser } = useWeb3React();
  const [now, setNow] = useState(Date.now());
  const { data, isLoading } = useCustomSWR(!account ? '-' : `/api/f2/dbr-balance-histo?account=${account}&v=1`, fetcher60sectimeout);
  const { signedBalance } = useAccountDBR(account);

  const evolution = data?.balances?.map((bal, i) => {
    const ts = data?.timestamps[i];
    return { utcDate: timestampToUTC(ts), debt: data?.debts[i], balance: bal, timestamp: ts, x: ts, y: bal };
  });
  evolution?.sort((a, b) => a.x - b.x);
  if (evolution?.length > 0 && !!connectedUser) {
    evolution.push({ x: now, utcDate: timestampToUTC(now), balance: signedBalance, timestamp: now, y: signedBalance });
  }
  return {
    ...data,
    currentBalance: !connectedUser ? null : signedBalance,
    evolution,
    isLoading,
  }
}