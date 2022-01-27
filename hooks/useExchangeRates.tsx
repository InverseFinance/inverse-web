import useEtherSWR from '@app/hooks/useEtherSWR'
import { SWR } from '@app/types'
import { BigNumber } from 'ethers'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getNetworkConfigConstants } from '@app/util/networks';

type ExchangeRates = {
  exchangeRates: { [key: string]: BigNumber }
}

export const useExchangeRates = (): SWR & ExchangeRates => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV, XINV_V1 } = getNetworkConfigConstants(chainId)

  const tokens = ANCHOR_TOKENS.concat([XINV_V1, XINV])

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
