import { AccountPositions, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR';

export const usePositions = (): SWR & AccountPositions => {
  const { data, error } = useCustomSWR(`/api/positions`, fetcher)

  return {
    positions: data?.positions || [],
    markets: data?.markets || [],
    nbPositions: data?.nbPositions || 0,
    isLoading: !error && !data,
    isError: error,
  }
}
