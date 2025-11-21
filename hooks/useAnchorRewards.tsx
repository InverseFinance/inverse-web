import { Web3Provider } from '@ethersproject/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import { SWR } from '@app/types'
import { getLensContract } from '@app/util/contracts'
import { useWeb3React } from '@app/util/wallet'
import { BigNumber } from 'ethers'
import { useRouter } from 'next/dist/client/router'
import useSWR from 'swr'

type AnchorRewards = {
  rewards: BigNumber
}

export const useAnchorRewards = (): SWR & AnchorRewards => {
  const { account, provider, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (provider ? (query?.viewAddress as string) : undefined) || account;
  const { INV, COMPTROLLER } = getNetworkConfigConstants(chainId);
  
  const { data, error } = useSWR(['getCompBalanceMetadataExt', INV, COMPTROLLER, userAddress], (...args) => {
    const [method, ...otherParams] = args
    if (provider) {
      return getLensContract(provider?.getSigner()).callStatic[method](...otherParams)
    }
    return undefined
  })

  return {
    rewards: data?.length ? data[3] : BigNumber.from(0),
    isLoading: !error && !data,
    isError: error,
  }
}
