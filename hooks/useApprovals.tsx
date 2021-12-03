import { Web3Provider } from '@ethersproject/providers'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { BigNumberList, SWR } from '@inverse/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'

type Approvals = {
  approvals: BigNumberList
}

export const useApprovals = (): SWR & Approvals => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { UNDERLYING } = getNetworkConfigConstants(chainId)
  const tokens = Object.entries(UNDERLYING).filter(([_, { address }]) => address)

  const { data, error } = useEtherSWR(
    tokens.map(([address, underlying]) => [underlying.address, 'allowance', account, address])
  )

  return {
    approvals: data?.reduce((approvals: { [key: string]: BigNumber }, approval: BigNumber, i: number) => {
      approvals[tokens[i][0]] = approval
      return approvals
    }, {}),
    isLoading: !error && !data,
    isError: error,
  }
}
// TODO: refactor all approval hooks using this one
export const useAllowances = (addresses: string[], target: string): SWR & Approvals => {
  const { account } = useWeb3React<Web3Provider>()
  const { data, error } = useEtherSWR(addresses.map(ad => ([ad, 'allowance', account, target])))

  const results: BigNumberList = {};
   
  if(data) {
    addresses.forEach((ad, i) => results[ad] = data[i])
  }

  return {
    approvals: results,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useStabilizerApprovals = (): SWR & Approvals => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { DAI, DOLA, STABILIZER } = getNetworkConfigConstants(chainId)
  const { data, error } = useEtherSWR([
    [DAI, 'allowance', account, STABILIZER],
    [DOLA, 'allowance', account, STABILIZER],
  ])

  return {
    approvals: data
      ? {
        [DAI]: data[0],
        [DOLA]: data[1],
      }
      : {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const useVaultApprovals = (): SWR & Approvals => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { DAI, USDC, VAULT_DAI_ETH, VAULT_DAI_WBTC, VAULT_DAI_YFI, VAULT_USDC_ETH } = getNetworkConfigConstants(chainId)
  const { data, error } = useEtherSWR([
    [DAI, 'allowance', account, VAULT_DAI_ETH],
    [DAI, 'allowance', account, VAULT_DAI_WBTC],
    [DAI, 'allowance', account, VAULT_DAI_YFI],
    [USDC, 'allowance', account, VAULT_USDC_ETH],
  ])

  return {
    approvals: data
      ? {
        [VAULT_DAI_ETH]: data[0],
        [VAULT_DAI_WBTC]: data[1],
        [VAULT_DAI_YFI]: data[2],
        [VAULT_USDC_ETH]: data[3],
      }
      : {},
    isLoading: !error && !data,
    isError: error,
  }
}
