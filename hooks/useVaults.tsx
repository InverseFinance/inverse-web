import { Web3Provider } from '@ethersproject/providers'
import { VAULT_TOKENS } from '@inverse/config'
import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import useSWR from 'swr'
import useEtherSWR from './useEtherSWR'

type Rates = {
  lastDistribution?: Date
  rates: { [key: string]: number }
}

type Rewards = {
  rewards: { [key: string]: number }
}

export const useVaultRates = (): SWR & Rates => {
  const { data, error } = useSWR(`${process.env.API_URL}/vaults`, fetcher)

  return {
    lastDistribution: data ? new Date(data.lastDistribution * 1000) : undefined,
    rates: data?.rates,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useVaultRewards = (): SWR & Rewards => {
  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(VAULT_TOKENS.map((address: string) => [address, 'unclaimedProfit', account]))

  return {
    rewards: data?.reduce((rewards: { [key: string]: BigNumber }, reward: BigNumber, i: number) => {
      rewards[VAULT_TOKENS[i]] = reward
      return rewards
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}
