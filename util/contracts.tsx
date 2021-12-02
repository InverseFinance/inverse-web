import { JsonRpcSigner } from '@ethersproject/providers'
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
import { GovEra, NetworkIds } from '@inverse/types'

export const getNewContract = (
  address: string,
  abi: string[],
  signer: JsonRpcSigner | undefined
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
  const { GOVERNANCE, GOVERNANCE_ALPHA } = getNetworkConfigConstants(chainId||NetworkIds.mainnet)
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
  if(!signer || signer?.provider?.network?.chainId.toString() !== NetworkIds.rinkeby) { return }

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

export const getDolaCrvPoolContract = (signer: JsonRpcSigner | undefined) => {
  const { DOLA3POOLCRV } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(DOLA3POOLCRV, DOLA3POOLCRV_ABI, signer);
}
