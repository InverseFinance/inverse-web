import { SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import useSWR from 'swr'

type InterestModelParameters = {
  kink: number
  multiplierPerYear: number
  jumpMultiplierPerYear: number
  baseRatePerYear: number
}

const KINK = 75;
const MULTIPLIER_PER_BLOCK = 5.33;
const JUMP_MULTIPLIER_PER_YEAR = 150;

export const useInterestModel = (): SWR & InterestModelParameters => {
  const { data, error } = useSWR(`/api/transparency/interest-model?chainId=${process.env.NEXT_PUBLIC_CHAIN_ID!}`, fetcher)

  return {
    kink: data?.kink || KINK,
    multiplierPerYear: data?.multiplierPerYear || MULTIPLIER_PER_BLOCK,
    jumpMultiplierPerYear: data?.jumpMultiplierPerYear || JUMP_MULTIPLIER_PER_YEAR,
    baseRatePerYear: data?.baseRatePerYear || 0,
    isLoading: !error && !data,
    isError: error,
  }
}