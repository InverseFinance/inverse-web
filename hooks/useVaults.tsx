import { Web3Provider } from '@ethersproject/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import { NetworkIds, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { useRouter } from 'next/dist/client/router'
import useSWR from 'swr'
import useEtherSWR from './useEtherSWR'

type Rates = {
  lastDistribution?: Date
  rates: { [key: string]: number }
}

type Rewards = {
  rewards: { [key: string]: BigNumber }
}

export const useVaultRates = (): SWR & Rates => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/vaults?chainId=${chainId||NetworkIds.mainnet}`, fetcher)

  return {
    lastDistribution: data ? new Date(data.lastDistribution * 1000) : undefined,
    rates: data?.rates,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useVaultRewards = (): SWR & Rewards => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const { VAULT_TOKENS } = getNetworkConfigConstants(chainId)

  const { data, error } = useEtherSWR(VAULT_TOKENS.map((address: string) => [address, 'unclaimedProfit', userAddress]))

  return {
    rewards: data?.reduce((rewards: { [key: string]: BigNumber }, reward: BigNumber, i: number) => {
      rewards[VAULT_TOKENS[i]] = reward
      return rewards
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}
