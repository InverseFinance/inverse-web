import { ANCHOR_TOKENS, XINV } from '@inverse/config/constants'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { SWR } from '@inverse/types'
import { BigNumber } from 'ethers'

type ExchangeRates = {
  exchangeRates: { [key: string]: BigNumber }
}

export const useExchangeRates = (): SWR & ExchangeRates => {
  const tokens = ANCHOR_TOKENS.concat([XINV])

  const { data, error } = useEtherSWR(tokens.map((address: string) => [address, 'exchangeRateStored']))

  return {
    exchangeRates: data?.reduce((exchangeRates: { [key: string]: BigNumber }, rate: BigNumber, i: number) => {
      exchangeRates[tokens[i]] = rate
      return exchangeRates
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}
