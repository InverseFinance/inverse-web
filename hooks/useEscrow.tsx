import { Web3Provider } from '@ethersproject/providers'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { SWR } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'

type Escrow = {
  withdrawalTime?: Date
  withdrawalAmount?: BigNumber
}

export const useEscrow = (escrowAddress: string): SWR & Escrow => {
  const { account } = useWeb3React<Web3Provider>()
  
  const { data, error } = useEtherSWR([escrowAddress, 'pendingWithdrawals', account])

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
