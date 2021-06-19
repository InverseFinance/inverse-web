import { Web3Provider } from '@ethersproject/providers'
import { ANCHOR_TOKENS, COMPTROLLER, UNDERLYING, XINV } from '@inverse/config'
import { Balances, Market } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { formatUnits } from 'ethers/lib/utils'
import { useBorrowBalances, useSupplyBalances } from './useBalances'
import useEtherSWR from './useEtherSWR'
import { useMarkets } from './useMarkets'
import { usePrices } from './usePrices'

export const useExchangeRates = () => {
  const tokens = ANCHOR_TOKENS.concat([XINV])
  const { data, error } = useEtherSWR(tokens.map((address: string) => [address, 'exchangeRateStored']))

  if (!data) {
    return {
      isLoading: !error,
      isError: error,
    }
  }

  const exchangeRates: Balances = {}
  tokens.forEach((address, i) => (exchangeRates[address] = data[i]))

  return {
    exchangeRates,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAccountLiquidity = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR([COMPTROLLER, 'getAccountLiquidity', account])

  const { markets } = useMarkets()
  const { prices } = usePrices()
  const { balances: supplyBalances } = useSupplyBalances()
  const { balances: borrowBalances } = useBorrowBalances()
  const { exchangeRates } = useExchangeRates()

  if (!data || !prices || !supplyBalances || !borrowBalances || !exchangeRates) {
    return {
      netApy: 0,
      usdSupply: 0,
      usdBorrow: 0,
      usdBorrowable: 0,
      isLoading: !error,
      isError: error,
    }
  }

  const usdSupply = Object.entries(supplyBalances).reduce((prev, [address, balance]) => {
    const underlying = UNDERLYING[address]
    return (
      prev +
      parseFloat(formatUnits(balance, underlying.decimals)) *
        parseFloat(formatUnits(exchangeRates[address])) *
        prices[underlying.coingeckoId].usd
    )
  }, 0)

  const usdBorrow = Object.entries(borrowBalances).reduce((prev, [address, balance]) => {
    const underlying = UNDERLYING[address]
    return prev + parseFloat(formatUnits(balance, underlying.decimals)) * prices[underlying.coingeckoId].usd
  }, 0)

  const supplyApy = markets.reduce(
    (prev: number, { token, underlying, supplyApy }: Market) =>
      prev +
      (supplyBalances[token]
        ? parseFloat(formatUnits(supplyBalances[token], underlying.decimals)) *
          parseFloat(formatUnits(exchangeRates[token])) *
          prices[underlying.coingeckoId].usd *
          (supplyApy || 1)
        : 0),
    0
  )

  const borrowApy = markets.reduce(
    (prev: number, { token, underlying, supplyApy }: Market) =>
      prev +
      (borrowBalances[token]
        ? parseFloat(formatUnits(borrowBalances[token], underlying.decimals)) *
          prices[underlying.coingeckoId].usd *
          (supplyApy || 1)
        : 0),
    0
  )

  const netApy =
    supplyApy > borrowApy
      ? (supplyApy - borrowApy) / usdSupply
      : borrowApy > supplyApy
      ? (supplyApy - borrowApy) / usdBorrow
      : 0

  return {
    netApy,
    usdSupply,
    usdBorrow,
    usdBorrowable: parseFloat(formatUnits(data[1])),

    isLoading: !error && !data,
    isError: error,
  }
}
