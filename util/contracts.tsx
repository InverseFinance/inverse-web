import { InfuraProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import {
  VAULT_ABI,
  COMPTROLLER_ABI,
  CTOKEN_ABI,
  STABILIZER_ABI,
  GOVERNANCE_ABI,
  XINV_ABI,
  ERC20_ABI,
  INV_ABI,
} from '@inverse/abis'
import { providers } from '@0xsequence/multicall'
import { ANCHOR_TOKENS, ANCHOR_STABILIZER, COMPTROLLER, GOVERNANCE, VAULT_TOKENS, XINV, INV } from '@inverse/config'

export const getNewProvider = () => new InfuraProvider(process.env.NETWORK, process.env.INFURA_ID)

export const getNewMulticallProvider = (provider: InfuraProvider) => new providers.MulticallProvider(provider)

export const getNewContract = (address: string, abi: string[], provider: any) => new Contract(address, abi, provider)

export const getVaultContract = (address: string, provider: any) => getNewContract(address, VAULT_ABI, provider)

export const getVaultContracts = (provider: any) => VAULT_TOKENS.map((address) => getVaultContract(address, provider))

export const getComptrollerContract = (provider: any) => getNewContract(COMPTROLLER, COMPTROLLER_ABI, provider)

export const getAnchorContract = (address: string, provider: any) => getNewContract(address, CTOKEN_ABI, provider)

export const getAnchorContracts = (provider: any) =>
  ANCHOR_TOKENS.map((address) => getAnchorContract(address, provider))

export const getStabilizerContract = (provider: any) => getNewContract(ANCHOR_STABILIZER, STABILIZER_ABI, provider)

export const getGovernanceContract = (provider: any) => getNewContract(GOVERNANCE, GOVERNANCE_ABI, provider)

export const getINVContract = (provider: any) => getNewContract(INV, INV_ABI, provider)

export const getXINVContract = (provider: any) => getNewContract(XINV, XINV_ABI, provider)
