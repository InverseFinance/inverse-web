import { F2Market, SWR, TokenWithBalance } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR';

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
  firmTotalTvl: number
  timestamp: number
  firmTvls: { tvl: number, market: F2Market }
}[] => {
  const { data, error } = useCustomSWR(`/api/f2/tvl`, fetcher)

  return {
    firmTotalTvl: data?.firmTotalTvl,
    firmTvls: data?.firmTvls || [],
    timestamp: data?.timestamp,
    isLoading: !error && !data,
    isError: error,
  }
}
