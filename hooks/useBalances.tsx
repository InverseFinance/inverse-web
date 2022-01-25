import { Web3Provider } from '@ethersproject/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { BigNumberList, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { useRouter } from 'next/dist/client/router'
import useSWR from 'swr'

type Balances = {
  balances: BigNumberList
}

export const useBalances = (addresses: string[], method = 'balanceOf'): SWR & Balances => {
  const { account } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;

  const { data, error } = useEtherSWR(
    addresses.map((address) => (address ? [address, method, userAddress] : ['getBalance', userAddress, 'latest']))
  )

  return {
    balances: data?.reduce((balances: BigNumberList, balance: BigNumber, i: number) => {
      balances[addresses[i] || 'CHAIN_COIN'] = balance
      return balances
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAccountBalances = (): SWR & Balances => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { UNDERLYING } = getNetworkConfigConstants(chainId)
  const tokens = Object.values(UNDERLYING)

  return useBalances(tokens.map(t => t.address))
}

export const useSupplyBalances = (): SWR & Balances => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV, XINV_V1 } = getNetworkConfigConstants(chainId)
  const tokens = ANCHOR_TOKENS.concat([XINV_V1, XINV])
  return useBalances(tokens)
}

export const useBorrowBalances = (): SWR & Balances => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS } = getNetworkConfigConstants(chainId)
  const tokens = ANCHOR_TOKENS
  return useBalances(tokens, 'borrowBalanceStored')
}

export const useStabilizerBalance = () => {
  const { data, error } = useSWR("/api/tvl", fetcher)

  return {
    balance: data?.stabilizer.tvl,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useVaultBalances = () => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { VAULT_DAI_ETH, VAULT_DAI_WBTC, VAULT_DAI_YFI, VAULT_USDC_ETH } = getNetworkConfigConstants(chainId)
  
  const { data } = useEtherSWR([
    [VAULT_DAI_ETH, 'balanceOf', account],
    [VAULT_DAI_WBTC, 'balanceOf', account],
    [VAULT_DAI_YFI, 'balanceOf', account],
    [VAULT_USDC_ETH, 'balanceOf', account],
  ])

  return {
    balances: {
      [VAULT_DAI_ETH]: data ? data[0] : BigNumber.from(0),
      [VAULT_DAI_WBTC]: data ? data[1] : BigNumber.from(0),
      [VAULT_DAI_YFI]: data ? data[2] : BigNumber.from(0),
      [VAULT_USDC_ETH]: data ? data[3] : BigNumber.from(0),
    },
  }
}
