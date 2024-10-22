import { F2Market, SWR, TokenWithBalance } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useCacheFirstSWR, useCustomSWR } from './useCustomSWR';

type TVL = {
  tvl: number
  data: { tvl: number, anchor: { tvl: number, assets: TokenWithBalance[] } }
}

export const useTVL = (): SWR & TVL => {
  const { data, error } = useCustomSWR(`/api/tvl`, fetcher)

  return {
    tvl: data?.tvl,
    data: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFirmTVL = (): SWR & {
  firmTotalTvl: number | number
  timestamp: number
  firmTvls: { tvl: number, market: F2Market }
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/tvl?v=2`)

  return {
    firmTotalTvl: data?.firmTotalTvl || null,
    firmTvls: data?.firmTvls || [],
    timestamp: data?.timestamp,
    isLoading: !error && !data,
    isError: error,
  }
}
