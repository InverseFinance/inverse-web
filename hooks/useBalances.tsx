import { Web3Provider } from '@ethersproject/providers'
import { ANCHOR_TOKENS, UNDERLYING, XINV } from '@inverse/config'
import { Balances } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import useEtherSWR from './useEtherSWR'

export const useAccountBalances = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(
    Object.values(UNDERLYING).map(({ address }: any) =>
      address ? [address, 'balanceOf', account] : ['getBalance', account, 'latest']
    )
  )

  if (!data) {
    return {
      isLoading: !error,
      isError: error,
    }
  }

  const balances: Balances = {}
  Object.values(UNDERLYING).forEach(({ address }: any, i) => (balances[address || 'ETH'] = data[i]))

  return {
    balances,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useSupplyBalances = () => {
  const tokens = ANCHOR_TOKENS.concat([XINV])
  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(tokens.map((address: string) => [address, 'balanceOf', account]))

  if (!data) {
    return {
      isLoading: !error,
      isError: error,
    }
  }

  const balances: Balances = {}
  tokens.forEach((address, i) => {
    balances[address] = data[i]
  })

  return {
    balances,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useBorrowBalances = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(ANCHOR_TOKENS.map((address: string) => [address, 'borrowBalanceStored', account]))

  if (!data) {
    return {
      isLoading: !error,
      isError: error,
    }
  }

  const balances: Balances = {}
  ANCHOR_TOKENS.forEach((address, i) => {
    balances[address] = data[i]
  })

  return {
    balances,
    isLoading: !error && !data,
    isError: error,
  }
}
