import { Web3Provider } from '@ethersproject/providers'
import { getNetworkConfigConstants } from '@inverse/config/networks'
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
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { UNDERLYING } = getNetworkConfigConstants(chainId)

  const tokens = Object.values(UNDERLYING)

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
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS, XINV, XINV_V1 } = getNetworkConfigConstants(chainId)

  const tokens = ANCHOR_TOKENS.concat([XINV_V1, XINV])

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

// export const useSupplyBalances = (): SWR & Balances => {
//   const { account, library } = useWeb3React<Web3Provider>()
//   const [xinvBalance, setXinvBalance] = useState()

//   const { data, error } = useEtherSWR(ANCHOR_TOKENS.map((address: string) => [address, 'balanceOf', account]))

//   useEffect(() => {
//     const fetchData = async () => {
//       setXinvBalance(await getXINVContract(library?.getSigner()).callStatic.balanceOfUnderlying(account))
//     }

//     if (library) {
//       fetchData()
//     }
//   }, [library])

//   const balances = data?.reduce((balances: { [key: string]: BigNumber }, balance: BigNumber, i: number) => {
//     balances[ANCHOR_TOKENS[i]] = balance
//     return balances
//   }, {})

//   if (balances && xinvBalance) {
//     balances[XINV] = xinvBalance
//   }

//   return {
//     balances,
//     isLoading: !error && !data,
//     isError: error,
//   }
// }

export const useBorrowBalances = (): SWR & Balances => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { ANCHOR_TOKENS } = getNetworkConfigConstants(chainId)

  const tokens = ANCHOR_TOKENS

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
