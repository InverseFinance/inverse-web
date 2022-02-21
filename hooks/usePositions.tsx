import { AccountPositions, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR';

type OptionProps = {
  accounts: string
}

export const usePositions = (options?: OptionProps): SWR & AccountPositions => {
  const { data, error } = useCustomSWR(`/api/positions?accounts=${options?.accounts}`, fetcher)

  return {
    positions: data?.positions || [],
    markets: data?.markets || [],
    prices: data?.prices || [],
    collateralFactors: data?.collateralFactors || [],
    nbPositions: data?.nbPositions || 0,
    isLoading: !error && !data,
    isError: error,
  }
}
