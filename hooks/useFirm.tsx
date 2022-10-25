
import { SWR } from "@app/types"
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from "./useCustomSWR";
import { useDBRMarkets } from "./useDBR";
import { f2CalcNewHealth } from "@app/util/f2";

export const useFirmPositions = (isShortfallOnly = false): SWR & {
  positions: any
} => {
  const { data, error } = useCustomSWR(`/api/f2/firm-positions?shortfallOnly=${isShortfallOnly}`, fetcher);
  const { markets } = useDBRMarkets();

  const positions = data ? data.positions : [];

  const positionsWithMarket = positions?.map(p => {
    const market = markets[p.marketIndex];
    const { newPerc, newCreditLimit, newLiquidationPrice, newCreditLeft } = f2CalcNewHealth(market, p.deposits, p.debt);
    return {
      ...p,
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
    isLoading: !error && !data,
    isError: error,
  }
}