import { Delegate, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCustomSWR } from './useCustomSWR';
import useEtherSWR from './useEtherSWR';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets';

const { INV, XINV } = getNetworkConfigConstants();

type Delegates = {
  delegates?: { [key: string]: Delegate }
}

type TopDelegates = {
  delegates: Delegate[]
}

export const useDelegates = (filter?: string): SWR & Delegates => {
  const { data, error } = useCustomSWR(`/api/delegates?filter=${filter || ''}`, fetcher)

  return {
    delegates: data?.delegates,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useTopDelegates = (): SWR & TopDelegates => {
  const { delegates, isLoading } = useDelegates()

  if (!delegates || isLoading) {
    return {
      delegates: [],
      isLoading,
    }
  }

  return {
    delegates: Object.values(delegates)
      .filter(({ votingPower }) => votingPower)
      .sort((a, b) => b.votingPower - a.votingPower)
      .map((delegate, i) => ({ ...delegate, rank: i + 1 }))
  }
}

export const useVotingPower = (account: string): SWR & { votingPower: number } => {
  const { data } = useEtherSWR([
    [XINV, 'exchangeRateStored'],
    [INV, 'getCurrentVotes', account],
    [XINV, 'getCurrentVotes', account],
  ]);

  const [exchangeRate, currentVotes, currentVotesX] = data || [];

  const votingPower = data ? getBnToNumber(currentVotes) + getBnToNumber(currentVotesX) * getBnToNumber(exchangeRate) : 0;

  return {
    votingPower
  }
}
