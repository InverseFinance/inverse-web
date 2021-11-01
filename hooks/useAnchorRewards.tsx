import { Web3Provider } from '@ethersproject/providers'
import { COMPTROLLER, INV } from '@inverse/config/constants'
import { SWR } from '@inverse/types'
import { getLensContract } from '@inverse/util/contracts'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import useSWR from 'swr'

type AnchorRewards = {
  rewards: BigNumber
}

export const useAnchorRewards = (): SWR & AnchorRewards => {
  const { account, library } = useWeb3React<Web3Provider>()
  const { data, error } = useSWR(['getCompBalanceMetadataExt', INV, COMPTROLLER, account], (...args) => {
    const [method, ...otherParams] = args
    if (library) {
      return getLensContract(library?.getSigner()).callStatic[method](...otherParams)
    }
    return undefined
  })

  return {
    rewards: data?.length ? data[3] : BigNumber.from(0),
    isLoading: !error && !data,
    isError: error,
  }
}
