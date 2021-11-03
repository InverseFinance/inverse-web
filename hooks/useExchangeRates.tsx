import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { SWR } from '@inverse/types'
import { BigNumber } from 'ethers'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getNetworkConfigConstants } from '@inverse/config/networks';

type ExchangeRates = {
  exchangeRates: { [key: string]: BigNumber }
}

export const useExchangeRates = (): SWR & ExchangeRates => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV } = getNetworkConfigConstants(chainId)

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
