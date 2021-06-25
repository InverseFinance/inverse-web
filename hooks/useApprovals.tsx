import { Web3Provider } from '@ethersproject/providers'
import { UNDERLYING } from '@inverse/config'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { useWeb3React } from '@web3-react/core'

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
