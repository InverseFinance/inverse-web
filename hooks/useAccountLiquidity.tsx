import { Web3Provider } from '@ethersproject/providers'
import { COMPTROLLER, UNDERLYING } from '@inverse/config'
import { useBorrowBalances, useSupplyBalances } from '@inverse/hooks/useBalances'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { useExchangeRates } from '@inverse/hooks/useExchangeRates'
import { useMarkets } from '@inverse/hooks/useMarkets'
import { useAnchorPrices } from '@inverse/hooks/usePrices'
import { Market, SWR } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'

type AccountLiquidity = {
  netApy: number
  usdSupply: number
  usdBorrow: number
  usdBorrowable: number
}

export const useAccountLiquidity = (): SWR & AccountLiquidity => {
  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR([COMPTROLLER, 'getAccountLiquidity', account])
  const { markets, isLoading: marketsIsLoading } = useMarkets()
  const { prices, isLoading: pricesIsLoading } = useAnchorPrices()
  const { balances: supplyBalances, isLoading: supplyBalancesIsLoading } = useSupplyBalances()
  const { balances: borrowBalances, isLoading: borrowBalancesIsLoading } = useBorrowBalances()
  const { exchangeRates, isLoading: exchangeRatesIsLoading } = useExchangeRates()

  if (
    !account ||
    !data ||
    marketsIsLoading ||
    pricesIsLoading ||
    supplyBalancesIsLoading ||
    borrowBalancesIsLoading ||
    exchangeRatesIsLoading ||
    !supplyBalances ||
    !borrowBalances ||
    !exchangeRates
  ) {
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
        parseFloat(formatUnits(prices[address], BigNumber.from(36).sub(underlying.decimals)))
    )
  }, 0)

  const usdBorrow = Object.entries(borrowBalances).reduce((prev, [address, balance]) => {
    const underlying = UNDERLYING[address]
    return (
      prev +
      parseFloat(formatUnits(balance, underlying.decimals)) *
        parseFloat(formatUnits(prices[address], BigNumber.from(36).sub(underlying.decimals)))
    )
  }, 0)

  const supplyApy = markets.reduce(
    (prev: number, { token, underlying, supplyApy }: Market) =>
      prev +
      (supplyBalances[token]
        ? parseFloat(formatUnits(supplyBalances[token], underlying.decimals)) *
          parseFloat(formatUnits(exchangeRates[token])) *
          parseFloat(formatUnits(prices[token], BigNumber.from(36).sub(underlying.decimals))) *
          (supplyApy || 1)
        : 0),
    0
  )

  const borrowApy = markets.reduce(
    (prev: number, { token, underlying, supplyApy }: Market) =>
      prev +
      (borrowBalances[token]
        ? parseFloat(formatUnits(borrowBalances[token], underlying.decimals)) *
          parseFloat(formatUnits(prices[token], BigNumber.from(36).sub(underlying.decimals))) *
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
