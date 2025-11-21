import { Web3Provider } from '@ethersproject/providers'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { SWR } from '@app/types'
import { useWeb3React } from '@app/util/wallet'
import { BigNumber } from 'ethers'
import { useRouter } from 'next/dist/client/router'

type Escrow = {
  withdrawalTime?: Date
  withdrawalAmount?: BigNumber
}

export const useEscrow = (escrowAddress: string): SWR & Escrow => {
  const { account } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  
  const { data, error } = useEtherSWR([escrowAddress, 'pendingWithdrawals', userAddress])

  if (!data) {
    return {
      isLoading: !error,
      isError: error,
    }
  }

  return {
    withdrawalTime: new Date(data[0].toNumber() * 1000),
    withdrawalAmount: data[1],
    isLoading: !error && !data,
    isError: error,
  }
}
