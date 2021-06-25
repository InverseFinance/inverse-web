import { TOKENS } from '@inverse/config'
import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type Prices = {
  prices: {
    [key: string]: {
      usd: number
    }
  }
}

export const usePrice = (coingeckoId: string): SWR & Prices => {
  const { data, error } = useSWR(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoId}`, fetcher)

  return {
    prices: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const usePrices = (): SWR & Prices => {
  const coingeckoIds = Object.values(TOKENS).map(({ coingeckoId }) => coingeckoId)
  const { data, error } = useSWR(
    `${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoIds.join(',')}`,
    fetcher
  )

  return {
    prices: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}
