import { Web3Provider } from '@ethersproject/providers'
import { useBorrowBalances, useSupplyBalances } from '@app/hooks/useBalances'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { useExchangeRates } from '@app/hooks/useExchangeRates'
import { useMarkets } from '@app/hooks/useMarkets'
import { useAnchorPrices, usePrices } from '@app/hooks/usePrices'
import { Market, StringNumMap, SWR } from '@app/types'
import { useWeb3React } from '@app/util/wallet'
import { formatUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useRouter } from 'next/dist/client/router'
import { getBnToNumber } from '@app/util/markets';

type AccountLiquidity = {
  usdSupply: number
  usdSupplyCoingecko: number
  usdBorrow: number
  usdBorrowable: number
  usdShortfall: number
}

export const useAccountLiquidity = (address?: string): SWR & AccountLiquidity => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = address || (query?.viewAddress as string) || account;
  const { COMPTROLLER, UNDERLYING } = getNetworkConfigConstants(chainId)
  const { data, error } = useEtherSWR([COMPTROLLER, 'getAccountLiquidity', userAddress])
  const { isLoading: marketsIsLoading } = useMarkets()
  const { prices: oraclePrices, isLoading: pricesIsLoading } = useAnchorPrices()
  const { balances: supplyBalances, isLoading: supplyBalancesIsLoading } = useSupplyBalances(userAddress)
  const { balances: borrowBalances, isLoading: borrowBalancesIsLoading } = useBorrowBalances(userAddress)
  const { exchangeRates, isLoading: exchangeRatesIsLoading } = useExchangeRates()
  const { prices: coingeckoPrices } = usePrices()

  if (
    !account ||
    !userAddress ||
    !data ||
    !oraclePrices ||
    marketsIsLoading ||
    pricesIsLoading ||
    supplyBalancesIsLoading ||
    borrowBalancesIsLoading ||
    exchangeRatesIsLoading ||
    !supplyBalances ||
    !borrowBalances ||
    !coingeckoPrices ||
    !exchangeRates
  ) {
    return {
      usdSupply: 0,
      usdSupplyCoingecko: 0,
      usdBorrow: 0,
      usdBorrowable: 0,
      usdShortfall: 0,
      isLoading: !error,
      isError: error,
    }
  }

  let prices: StringNumMap = {}
  for (var key in oraclePrices) {
    if (oraclePrices.hasOwnProperty(key)) {
      prices[key] = parseFloat(formatUnits(oraclePrices[key], BigNumber.from(36).sub(UNDERLYING[key].decimals)))
    }
  }
  // const prices = oraclePrices
  // .map((v,i) => parseFloat(formatUnits(v, BigNumber.from(36).sub(UNDERLYING[addresses[i]].decimals))))
  // .reduce((p,v,i) => ({...p, [addresses[i]]:v}), {})

  const usdSupply = Object.entries(supplyBalances).reduce((prev, [address, balance]) => {
    const underlying = UNDERLYING[address]
    return (
      prev +
      parseFloat(formatUnits(balance, underlying.decimals)) *
      parseFloat(formatUnits(exchangeRates[address])) *
      prices[address]
    )
  }, 0)

  const usdSupplyCoingecko = Object.entries(supplyBalances).reduce((prev, [address, balance]) => {
    const underlying = UNDERLYING[address]
 
    return (
      prev +
      parseFloat(formatUnits(balance, underlying.decimals)) *
      parseFloat(formatUnits(exchangeRates[address])) *
      (coingeckoPrices[underlying.coingeckoId]?.usd || prices[address])
    )
  }, 0)

  const usdBorrow = Object.entries(borrowBalances).reduce((prev, [address, balance]) => {
    const underlying = UNDERLYING[address]
    return prev + parseFloat(formatUnits(balance, underlying.decimals)) * prices[address]
  }, 0);

  const [accLiqErr, extraBorrowableAmount, shortfallAmount] = data;

  return {
    usdSupply,
    usdSupplyCoingecko,
    usdBorrow,
    usdBorrowable: parseFloat(formatUnits(extraBorrowableAmount)),
    usdShortfall: parseFloat(formatUnits(shortfallAmount)),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAccountSnapshot = (market: Market, userAddress: string | undefined) => {
  const { data } = useEtherSWR([market.token, 'getAccountSnapshot', userAddress])
  const [err, held, owed, exRate] = data || [BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0'), BigNumber.from('0')];
  return {
    held: getBnToNumber(held, market.underlying.decimals) * getBnToNumber(exRate, market.underlying.decimals),
    owed: getBnToNumber(owed, market.underlying.decimals),
  }
}
