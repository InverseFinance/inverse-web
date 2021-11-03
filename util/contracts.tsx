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
} from '@inverse/config/abis'
import { getNetworkConfigConstants } from '@inverse/config/networks'

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

export const getGovernanceContract = (signer: JsonRpcSigner | undefined) => {
  const { GOVERNANCE } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(GOVERNANCE, GOVERNANCE_ABI, signer)
}

export const getEscrowContract = (signer: JsonRpcSigner | undefined) => {
  const { ESCROW } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(ESCROW, ESCROW_ABI, signer)
}
  
export const getINVContract = (signer: JsonRpcSigner | undefined) => {
  const { INV } = getNetworkConfigConstants(signer?.provider?.network?.chainId);
  return getNewContract(INV, INV_ABI, signer)
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
