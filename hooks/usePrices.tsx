import { ANCHOR_TOKENS, ORACLE, TOKENS, XINV } from '@inverse/config'
import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import { BigNumber } from 'ethers'
import useSWR from 'swr'
import useEtherSWR from './useEtherSWR'

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

export const useAnchorPrices = (): any => {
  const tokens = ANCHOR_TOKENS.concat([XINV])
  const { data, error } = useEtherSWR(tokens.map((address: string) => [ORACLE, 'getUnderlyingPrice', address]))
  return {
    prices: data?.reduce((prices: { [key: string]: BigNumber }, price: BigNumber, i: number) => {
      prices[tokens[i]] = price
      return prices
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}
