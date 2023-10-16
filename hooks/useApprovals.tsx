import { Web3Provider } from '@ethersproject/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { BigNumberList, SWR } from '@app/types'
import { useWeb3React } from '@web3-react/core'
import { BigNumber } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'
import { ERC20_ABI } from '@app/config/abis'
import { EthXe } from '@app/util/enso'
import { getBnToNumber } from '@app/util/markets'

type Approvals = {
  approvals: BigNumberList
}

export const useApprovals = (): SWR & Approvals => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const { UNDERLYING } = getNetworkConfigConstants(chainId)
  const tokens = Object.entries(UNDERLYING).filter(([_, { address }]) => address)

  const { data, error } = useEtherSWR(
    tokens.map(([address, underlying]) => [underlying.address, 'allowance', userAddress, address])
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
export const useAllowances = (addresses: string[], target: string, from?: string): SWR & Approvals => {
  const { account } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = from || (query?.viewAddress as string) || account;
  const filteredAddresses = addresses.filter(ad => !!ad && isAddress(ad));
  const { data, error } = useEtherSWR({
    abi: ERC20_ABI,
    args: filteredAddresses.map(ad => ([ad, 'allowance', userAddress, target])),
  })

  const results: BigNumberList = {};

  if (data) {
    filteredAddresses.forEach((ad, i) => results[ad] = data[i])
  }

  return {
    approvals: results,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useIsApproved = (token: string, spender: string, from: string, amount = 0): SWR & {
  isApproved: boolean
  approvedAmount: number
} => {
  const isEth = !token || token === EthXe;
  const { data, error } = useEtherSWR({
    abi: ERC20_ABI,
    args: [
      [token, 'allowance', from, spender],
      [token, 'decimals'],
    ],
  });
 
  const [allowance, decimals] = data ? data : [BigNumber.from('0'), 18];
  const approvedAmount = isEth ? Infinity : getBnToNumber(allowance, getBnToNumber(decimals, 0));
  return {
    isApproved: isEth ? true : approvedAmount > 0 && approvedAmount >= amount,
    approvedAmount,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useStabilizerApprovals = (): SWR & Approvals => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { DAI, DOLA, STABILIZER } = getNetworkConfigConstants(chainId)
  return useAllowances([DAI, DOLA], STABILIZER)
}
