
import { F2Market, SWR } from "@app/types"
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from "./useCustomSWR";
import { useDBRMarkets } from "./useDBR";
import { f2CalcNewHealth } from "@app/util/f2";
import { getBnToNumber, getNumberToBn } from "@app/util/markets";
import { useMultiContractEvents } from "./useContractEvents";
import { DBR_ABI, F2_MARKET_ABI } from "@app/config/abis";
import { getNetworkConfigConstants } from "@app/util/networks";

const oneDay = 86400000;
const oneYear = oneDay * 365;

const { DBR } = getNetworkConfigConstants();

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
      isLiquidatable: p.liquidatableDebt > 0,
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

export const useDBRActiveHolders = (): SWR & {
  positions: any,
  timestamp: number,
} => {
  const { data, error } = useCustomSWR(`/api/f2/dbr-deficits?v2`, fetcher);
  const { positions: firmPositions } = useFirmPositions();

  const activeDbrHolders = data ? data.activeDbrHolders : [];

  const activeDbrHoldersWithMarkets = activeDbrHolders.map(s => {
    const marketPositions = firmPositions?.filter(p => p.user === s.user) || [];
    const marketIcons = marketPositions?.map(p => p.market.underlying.image) || [];
    const dailyBurn = s.debt/oneYear * oneDay;
    const dbrNbDaysExpiry = dailyBurn ? s.signedBalance / dailyBurn : 0;
    const dbrExpiryDate = !s.debt ? null : (+new Date() + dbrNbDaysExpiry * oneDay);
    return {
      ...s,
      marketPositions,
      marketIcons,
      dailyBurn,
      dbrExpiryDate,
    }
  }).filter(p => p.debt > 0);

  return {
    positions: activeDbrHoldersWithMarkets,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFirmMarketEvents = (market: F2Market, account: string) => {
  const { groupedEvents, isLoading, error } = useMultiContractEvents([
    [market.address, F2_MARKET_ABI, 'Deposit', [account]],
    [market.address, F2_MARKET_ABI, 'Withdraw', [account]],
    [market.address, F2_MARKET_ABI, 'Borrow', [account]],
    [market.address, F2_MARKET_ABI, 'Repay', [account]],
    [market.address, F2_MARKET_ABI, 'Liquidate', [account]],
    // [market.address, F2_MARKET_ABI, 'CreateEscrow', [account]],
    [DBR, DBR_ABI, 'ForceReplenish', [account]],
  ], `firm-market-${market.address}-${account}`);

  const events = groupedEvents.flat();
  events.sort((a, b) => a.blockNumber !== b.blockNumber ? (b.blockNumber - a.blockNumber) : b.logIndex - a.logIndex);

  return {
    events: events.map(e => {
      const isCollateralEvent = ['Deposit', 'Withdraw'].includes(e.event);
      const decimals = isCollateralEvent ? market.underlying.decimals : 18;
      return {
        blockNumber: e.blockNumber,
        txHash: e.transactionHash,    
        amount: e.args.amount ? getBnToNumber(e.args.amount, decimals) : undefined,
        deficit: e.args.deficit ? getBnToNumber(e.args.deficit, 18) : undefined,
        repaidDebt: e.args.repaidDebt ? getBnToNumber(e.args.repaidDebt, 18) : undefined,
        liquidatorReward: e.args.liquidatorReward ? getBnToNumber(e.args.liquidatorReward, 18) : undefined,
        repayer: e.args.repayer,
        to: e.args.to,
        escrow: e.args.escrow,
        replenisher: e.args.replenisher,
        name: e.event,
        isCollateralEvent,
        tokenName: isCollateralEvent ? market.underlying.symbol : 'DOLA',
      }
    }),
    isLoading,
    error,
  }
}