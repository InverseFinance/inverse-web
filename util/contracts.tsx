import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import {
  VAULT_ABI,
  COMPTROLLER_ABI,
  CTOKEN_ABI,
  STABILIZER_ABI,
  GOVERNANCE_ABI,
  INV_ABI,
  CETHER_ABI,
  ERC20_ABI,
  LENS_ABI,
  ESCROW_ABI,
  MULTIDELEGATOR_ABI,
  DOLA3POOLCRV_ABI,
} from '@inverse/config/abis'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { GovEra, NetworkIds, Token } from '@inverse/types'
import { formatUnits, parseUnits } from 'ethers/lib/utils';

export const getNewContract = (
  address: string,
  abi: string[],
  signer: JsonRpcSigner | Web3Provider | undefined
) => new Contract(address, abi, signer)

export const getVaultContract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => getNewContract(address, VAULT_ABI, signer)

export const getComptrollerContract = (signer: JsonRpcSigner | undefined) => {
  const { COMPTROLLER } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(COMPTROLLER, COMPTROLLER_ABI, signer);
}

export const getAnchorContract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => {
  return getNewContract(address, CTOKEN_ABI, signer)
}

export const getStabilizerContract = (signer: JsonRpcSigner | undefined) => {
  const { STABILIZER } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(STABILIZER, STABILIZER_ABI, signer);
}

export const getGovernanceAddress = (era: GovEra, chainId?: string | number) => {
  const { GOVERNANCE, GOVERNANCE_ALPHA } = getNetworkConfigConstants(chainId || NetworkIds.mainnet)
  const govs = { [GovEra.alpha]: GOVERNANCE_ALPHA, [GovEra.mils]: GOVERNANCE };
  return govs[era];
}

export const getGovernanceContract = (signer: JsonRpcSigner | undefined, era: GovEra) => {
  const govAddress = getGovernanceAddress(era);
  return getNewContract(govAddress, GOVERNANCE_ABI, signer)
}

export const getEscrowContract = (escrowAddress: string, signer: JsonRpcSigner | undefined) => {
  return getNewContract(escrowAddress, ESCROW_ABI, signer)
}

export const getINVContract = (signer: JsonRpcSigner | undefined) => {
  const { INV } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(INV, INV_ABI, signer)
}

export const getMultiDelegatorContract = (signer: JsonRpcSigner | undefined) => {
  const { MULTI_DELEGATOR } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(MULTI_DELEGATOR, MULTIDELEGATOR_ABI, signer);
}

export const getCEtherContract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => getNewContract(address, CETHER_ABI, signer)

export const getERC20Contract = (
  address: string,
  signer: JsonRpcSigner | undefined
) => getNewContract(address, ERC20_ABI, signer)

export const getLensContract = (signer: JsonRpcSigner | undefined) => {
  const { LENS } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(LENS, LENS_ABI, signer);
}

export const getTokensFromFaucet = async (tokenSymbol: 'INV' | 'DOLA', qty: string, signer: JsonRpcSigner | undefined) => {
  if (!signer || signer?.provider?.network?.chainId.toString() !== NetworkIds.rinkeby) { return }

  const { [tokenSymbol]: tokenAddress } = getNetworkConfigConstants(NetworkIds.rinkeby);
  // TODO: do corresponding logic (a special ERC20 token contract or a dedicated faucet contract to come)
  // const contract = getNewContract(tokenAddress, FAUCET_ABI, signer);
  // const tx = await contract.faucetFunction(utils.parseUnits(qty, 18))
  // const txReceipt = await tx.wait()
}

export const getDOLAsFromFaucet = (signer: JsonRpcSigner | undefined) => {
  getTokensFromFaucet('DOLA', '2000', signer)
}

export const getINVsFromFaucet = (signer: JsonRpcSigner | undefined) => {
  getTokensFromFaucet('INV', '2', signer)
}

export const getDolaCrvPoolContract = (signer: JsonRpcSigner | Web3Provider | undefined) => {
  const { DOLA3POOLCRV } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(DOLA3POOLCRV, DOLA3POOLCRV_ABI, signer);
}

const CRV_INDEXES: any = { DOLA: 0, DAI: 1, USDC: 2, USDT: 3 }

export const crvSwap = (signer: JsonRpcSigner, fromUnderlying: Token, toUnderlying: Token, amount: number, toAmount: number, maxSlippage: number) => {

  const contract = getDolaCrvPoolContract(signer);

  const bnAmount = parseUnits(amount.toString(), fromUnderlying.decimals);
  const bnMinReceived = parseUnits((toAmount - (toAmount * maxSlippage / 100)).toString(), toUnderlying.decimals);

  const fromIndex = CRV_INDEXES[fromUnderlying.symbol]
  const toIndex = CRV_INDEXES[toUnderlying.symbol]

  return contract.exchange_underlying(fromIndex, toIndex, bnAmount, bnMinReceived);
}
// useful to get the exRate
export const crvGetDyUnderlying = async (signerOrProvider: JsonRpcSigner | Web3Provider, fromUnderlying: Token, toUnderlying: Token, amount: number) => {
  if(amount <= 0) { return '0' }
  const contract = getDolaCrvPoolContract(signerOrProvider);

  const fromIndex = CRV_INDEXES[fromUnderlying.symbol]
  const toIndex = CRV_INDEXES[toUnderlying.symbol]
  
  const bnAmount = parseUnits(amount.toString(), fromUnderlying.decimals);

  try {
    return formatUnits(await contract.get_dy_underlying(fromIndex, toIndex, bnAmount), toUnderlying.decimals);
  } catch (e) {
    console.log(e);
    return '0'
  }
}
