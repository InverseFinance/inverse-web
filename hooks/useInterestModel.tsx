import { BLOCKS_PER_YEAR } from '@app/config/constants'
import { SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR'

type InterestModelParameters = {
  kink: number
  multiplierPerYear: number
  jumpMultiplierPerYear: number
  baseRatePerYear: number
  multiplierPerBlock: number
  jumpMultiplierPerBlock: number
  baseRatePerBlock: number
}

const KINK = 75;
const MULTIPLIER_PER_YEAR = 5.33;
const JUMP_MULTIPLIER_PER_YEAR = 150;

export const useInterestModel = (): SWR & InterestModelParameters => {
  const { data, error } = useCustomSWR(`/api/transparency/interest-model?chainId=${process.env.NEXT_PUBLIC_CHAIN_ID!}`, fetcher)

  return {
    kink: data?.kink || KINK,
    multiplierPerYear: data?.multiplierPerYear || MULTIPLIER_PER_YEAR,
    jumpMultiplierPerYear: data?.jumpMultiplierPerYear || JUMP_MULTIPLIER_PER_YEAR,
    baseRatePerYear: data?.baseRatePerYear || 0,
    multiplierPerBlock: data?.multiplierPerBlock || MULTIPLIER_PER_YEAR / BLOCKS_PER_YEAR,
    jumpMultiplierPerBlock: data?.jumpMultiplierPerBlock || JUMP_MULTIPLIER_PER_YEAR / BLOCKS_PER_YEAR,
    baseRatePerBlock: data?.baseRatePerBlock || 0,
    isLoading: !error && !data,
    isError: error,
  }
}