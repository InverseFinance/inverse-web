import { AccountPositions, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR';
import useEtherSWR from './useEtherSWR';
import { getNetworkConfigConstants } from '@app/util/networks';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getBnToNumber } from '@app/util/markets';

type OptionProps = {
  accounts: string
}

export const usePositions = (options?: OptionProps): SWR & AccountPositions => {
  const { data, error } = useCustomSWR(`/api/positions?v=5&accounts=${options?.accounts}`, (url) => fetcher(url, undefined, 30000))

  return {
    lastUpdate: data?.lastUpdate || 0,
    positions: data?.positions || [],
    markets: data?.markets || [],
    prices: data?.prices || [],
    liquidPrices: data?.liquidPrices || [],
    collateralFactors: data?.collateralFactors || [],
    nbPositions: data?.nbPositions || 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useLiquidationIncentive = (): SWR & { bonusFactor: number } => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { COMPTROLLER } = getNetworkConfigConstants(chainId)

  const { data, error } = useEtherSWR([COMPTROLLER, 'liquidationIncentiveMantissa']);

  return {
    bonusFactor: data ? getBnToNumber(data) : 1.1,
    isError: !!error,
  }
}
