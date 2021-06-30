import { Web3Provider } from '@ethersproject/providers'
import { ANCHOR_TOKENS, UNDERLYING, XINV } from '@inverse/config'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import useSWR from 'swr'

type Balances = {
  balances: { [key: string]: BigNumber }
}

export const useAccountBalances = (): SWR & Balances => {
  const tokens = Object.values(UNDERLYING)

  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(
    tokens.map(({ address }) => (address ? [address, 'balanceOf', account] : ['getBalance', account, 'latest']))
  )

  return {
    balances: data?.reduce((balances: { [key: string]: BigNumber }, balance: BigNumber, i: number) => {
      balances[tokens[i].address || 'ETH'] = balance
      return balances
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useSupplyBalances = (): SWR & Balances => {
  const tokens = ANCHOR_TOKENS.concat([XINV])

  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(tokens.map((address: string) => [address, 'balanceOf', account]))

  return {
    balances: data?.reduce((balances: { [key: string]: BigNumber }, balance: BigNumber, i: number) => {
      balances[tokens[i]] = balance
      return balances
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useBorrowBalances = (): SWR & Balances => {
  const tokens = ANCHOR_TOKENS

  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(tokens.map((address: string) => [address, 'borrowBalanceStored', account]))

  return {
    balances: data?.reduce((balances: { [key: string]: BigNumber }, balance: BigNumber, i: number) => {
      balances[tokens[i]] = balance
      return balances
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useStabilizerBalance = () => {
  const { data, error } = useSWR(`${process.env.API_URL}/tvl`, fetcher)

  return {
    balance: data?.stabilizer.tvl,
    isLoading: !error && !data,
    isError: error,
  }
}
