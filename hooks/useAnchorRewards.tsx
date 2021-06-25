import { Web3Provider } from '@ethersproject/providers'
import { LENS_ABI } from '@inverse/abis'
import { COMPTROLLER, INV, LENS } from '@inverse/config'
import { SWR } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, Contract } from 'ethers'
import useSWR from 'swr'

type AnchorRewards = {
  rewards: BigNumber
}

export const useAnchorRewards = (): SWR & AnchorRewards => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { data, error } = useSWR(['getCompBalanceMetadataExt', INV, COMPTROLLER, account], (...args) => {
    const [method, ...otherParams] = args
    if (library) {
      return new Contract(LENS, LENS_ABI, library?.getSigner()).callStatic[method](...otherParams)
    }
    return undefined
  })

  return {
    rewards: data?.length ? data[3] : BigNumber.from(0),
    isLoading: !error && !data,
    isError: error,
  }
}
