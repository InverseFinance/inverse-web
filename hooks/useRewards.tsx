import { Web3Provider } from '@ethersproject/providers'
import { LENS_ABI } from '@inverse/abis'
import { COMPTROLLER, INV, LENS } from '@inverse/config'
import { useWeb3React } from '@web3-react/core'
import { Contract } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import useSWR from 'swr'

// TODO: Create generic static fetcher
export const useRewards = () => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { data, error } = useSWR(['getCompBalanceMetadataExt', INV, COMPTROLLER, account], (...args) => {
    const [method, ...otherParams] = args
    if (library) {
      return new Contract(LENS, LENS_ABI, library?.getSigner()).callStatic[method](...otherParams)
    }
    return undefined
  })

  return {
    rewards: data ? parseFloat(formatUnits(data[3])) : 0,
    isLoading: !error && !data,
    isError: error,
  }
}
