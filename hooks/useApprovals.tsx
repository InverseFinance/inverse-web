import { Web3Provider } from '@ethersproject/providers'
import { UNDERLYING } from '@inverse/config'
import { useWeb3React } from '@web3-react/core'
import useEtherSWR from './useEtherSWR'

export const useApprovals = () => {
  const { account } = useWeb3React<Web3Provider>()

  const tokens = Object.entries(UNDERLYING).filter(([_, underlying]: any) => underlying.address)
  const { data, error } = useEtherSWR(
    tokens.map(([address, underlying]: any) => [underlying.address, 'allowance', account, address])
  )

  if (!data) {
    return {
      isLoading: !error,
      isError: error,
    }
  }

  const approvals: any = {}
  tokens.forEach(([address], i) => {
    approvals[address] = data[i]
  })

  return {
    approvals,
    isLoading: !error && !data,
    isError: error,
  }
}
