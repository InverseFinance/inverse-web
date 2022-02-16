import useEtherSWR from '@app/hooks/useEtherSWR'
import { SWR } from '@app/types'
import { BigNumber } from 'ethers'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { HAS_REWARD_TOKEN } from '@app/config/constants';

type ExchangeRates = {
  exchangeRates: { [key: string]: BigNumber }
}

export const useExchangeRates = (): SWR & ExchangeRates => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV, XINV_V1 } = getNetworkConfigConstants(chainId)

  const tokens = ANCHOR_TOKENS.concat(HAS_REWARD_TOKEN && XINV ? [XINV] : []).concat(HAS_REWARD_TOKEN && XINV_V1 ? [XINV_V1] : [])

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
