import { getNetworkConfigConstants } from '@app/util/networks'
import { Prices, StringNumMap, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { BigNumber } from 'ethers'
import useEtherSWR from './useEtherSWR'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCustomSWR } from './useCustomSWR'
import { HAS_REWARD_TOKEN } from '@app/config/constants'
import { formatUnits } from '@ethersproject/units'
import { UNDERLYING } from '@app/variables/tokens'

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

  const tokens = ANCHOR_TOKENS.concat(HAS_REWARD_TOKEN && XINV ? [XINV] : []).concat(HAS_REWARD_TOKEN && XINV_V1 ? [XINV_V1] : [])
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

export const useAnchorPricesUsd = () => {
  const { prices, isLoading, isError } = useAnchorPrices()

  let usdPrices: StringNumMap = {}
  for (var key in prices) {
      if (prices.hasOwnProperty(key)) {
        usdPrices[key] = parseFloat(formatUnits(prices[key], BigNumber.from(36).sub(UNDERLYING[key].decimals)))
      }
  }

  return {
    prices: usdPrices,
    isError,
    isLoading,
  }
}
