import { Delegate, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCustomSWR } from './useCustomSWR';
import useEtherSWR from './useEtherSWR';
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets';
import { BLOCKS_PER_DAY } from '@app/config/constants';

const { INV, XINV } = getNetworkConfigConstants();

type Delegates = {
  delegates?: { [key: string]: Delegate }
}

type TopDelegates = {
  delegates: Delegate[]
}

export const useDelegates = (ignore = false, filter?: string): SWR & Delegates => {
  const { data, error } = useCustomSWR(ignore ? '-' : `/api/delegates?filter=${filter || ''}`, fetcher)

  return {
    blockNumber: data?.blockNumber,
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

export const useTopAndSmallDelegates = (isOpen = false, filter?: string): SWR & TopDelegates => {
  const { delegates, blockNumber, isLoading } = useDelegates(isOpen, filter)

  if (!delegates || isLoading) {
    return {
      delegates: [],
      isLoading,
    }
  }

  // only consider votes in the last 90 days
  const minBlockCheck = blockNumber - BLOCKS_PER_DAY * 90;

  const relevantDelegates = Object.values(delegates)
    .filter(({ votingPower, votes }) => votingPower >= 10)
    .map(d => {
      const relevantVotes = d.votes.filter(vote => vote.bn >= minBlockCheck);
      // the closer the vote the higher the score for that vote
      const recentVotingScore = (relevantVotes.length +
         relevantVotes.reduce((prev, curr) => prev + Math.min((curr.bn - minBlockCheck)/(blockNumber-minBlockCheck), 1), 0)
    ) / Math.sqrt(d.votingPower)
         ;
      // the more active (and recent) voter but lower voting power the higher the score
      return { ...d, decentralizationScore: recentVotingScore, nbRecentVotes: relevantVotes.length }
    });

  const topDelegates = relevantDelegates.filter(d => d.votingPower >= 10)
    .sort((a, b) => b.votingPower - a.votingPower)
    .slice(0, 50);

  const smallButActive = relevantDelegates.filter(d => d.votingPower >= 10 && d.votingPower <= 15000 && d.nbRecentVotes > 0)
    .sort((a, b) => b.decentralizationScore - a.decentralizationScore)
    .slice(0, 50);
    
  return {
    topDelegates,
    smallButActive,
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
