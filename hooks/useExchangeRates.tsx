import useEtherSWR from '@app/hooks/useEtherSWR'
import { SWR } from '@app/types'
import { BigNumber } from 'ethers'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getNetworkConfigConstants } from '@app/util/networks';
import { HAS_REWARD_TOKEN } from '@app/config/constants';
import { useCustomSWR } from './useCustomSWR';
import { getBnToNumber } from '@app/util/markets';
import { parseEther } from '@ethersproject/units';

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

export const useExchangeRatesV2 = (): SWR & ExchangeRates => {
  const { exchangeRates: storedRates } = useExchangeRates();
  const { data: simData } = useCustomSWR('/api/ex-rates');

  const isLoading = !storedRates || !simData;
  const freshRates: { [key:string]: BigNumber } = {};

  if(!isLoading) {
    const { exRates: simExRates } = simData;
    Object.keys(storedRates).map(ctoken => {
      const stored = getBnToNumber(storedRates[ctoken]);
      freshRates[ctoken] = parseEther(Math.max(stored, simExRates[ctoken]?.realTime).toString());
    });
  }

  return { exchangeRates: isLoading ? storedRates : freshRates, isLoading }
}