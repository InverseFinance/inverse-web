
import { SWR } from "@app/types"
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from "./useCustomSWR";
import { useDBRMarkets } from "./useDBR";
import { f2CalcNewHealth } from "@app/util/f2";
import { getNumberToBn } from "@app/util/markets";

export const useFirmPositions = (isShortfallOnly = false): SWR & {
  positions: any,
  timestamp: number,
} => {
  const { data, error } = useCustomSWR(`/api/f2/firm-positions?shortfallOnly=${isShortfallOnly}`, fetcher);
  const { markets } = useDBRMarkets();

  const positions = data ? data.positions : [];

  const positionsWithMarket = positions?.map(p => {
    const market = markets[p.marketIndex];
    const { newPerc, newCreditLimit, newLiquidationPrice, newCreditLeft } = f2CalcNewHealth(market, p.deposits, p.debt);
    const seizableWorth = p.liquidatableDebt + market.liquidationIncentive*p.liquidatableDebt;
    return {
      ...p,
      seizable: seizableWorth / market.price,
      seizableWorth,
      liquidatableDebtBn: getNumberToBn(p.liquidatableDebt), 
      isLiquidatable: p.liquidatableDebt > 0 ? 'Yes' : 'No',
      marketName: market.name,
      market,
      perc: newPerc,
      creditLimit: newCreditLimit,
      liquidationPrice: newLiquidationPrice,
      creditLeft: newCreditLeft,
      key: `${p.user}-${p.marketIndex}`,
    }
  });

  return {
    positions: positionsWithMarket,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRShortfalls = (): SWR & {
  positions: any,
  timestamp: number,
} => {
  const { data, error } = useCustomSWR(`/api/f2/dbr-shortfalls`, fetcher);
  const { positions: firmPositions } = useFirmPositions();

  const dbrShortfalls = data ? data.shortfalls : [];

  const dbrDetailedShortfalls = dbrShortfalls.map(s => {
    const marketPositions = firmPositions?.filter(p => p.user === s.user) || [];
    const marketIcons = marketPositions.map(p => p.market.underlying.image);
    return {
      ...s,
      marketPositions,
      marketIcons,
    }
  });

  return {
    positions: dbrDetailedShortfalls,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}