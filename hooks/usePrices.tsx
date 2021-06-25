import { TOKENS } from '@inverse/config'
import { Token } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

export const usePrice = (coingeckoId: string) => {
  const { data, error } = useSWR(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoId}`, fetcher)

  return {
    prices: data,
    isLoading: !error && !data,
    isError: error,
  }
}

export const usePrices = () => {
  const coingeckoIds = Object.values(TOKENS).map(({ coingeckoId }: any) => coingeckoId)
  const { data, error } = useSWR(
    `${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoIds.join(',')}`,
    fetcher
  )

  return {
    prices: data,
    isLoading: !error && !data,
    isError: error,
  }
}
