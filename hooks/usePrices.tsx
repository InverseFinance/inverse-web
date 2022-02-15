import { getNetworkConfigConstants } from '@app/util/networks'
import { Prices, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { BigNumber } from 'ethers'
import useEtherSWR from './useEtherSWR'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCustomSWR } from './useCustomSWR'

export const usePrice = (coingeckoId: string): SWR & Prices => {
  const { data, error } = useCustomSWR(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoId}`, fetcher)

  return {
    prices: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const usePrices = (): SWR & Prices => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { TOKENS } = getNetworkConfigConstants(chainId)

  const coingeckoIds = Object.values(TOKENS).map(({ coingeckoId }) => coingeckoId)
  const { data, error } = useCustomSWR(
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
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV, XINV_V1, ORACLE } = getNetworkConfigConstants(chainId)

  const tokens = ANCHOR_TOKENS.concat([XINV, XINV_V1])
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
