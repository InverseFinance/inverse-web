import { InfuraProvider, Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import {
  VAULT_ABI,
  COMPTROLLER_ABI,
  CTOKEN_ABI,
  STABILIZER_ABI,
  GOVERNANCE_ABI,
  XINV_ABI,
  INV_ABI,
  HARVESTER_ABI,
} from '@inverse/abis'
import { providers } from '@0xsequence/multicall'
import { ANCHOR_TOKENS, STABILIZER, COMPTROLLER, GOVERNANCE, VAULT_TOKENS, XINV, INV, HARVESTER } from '@inverse/config'
import { MulticallProvider } from '@0xsequence/multicall/dist/declarations/src/providers'

export const getNewProvider = () => new InfuraProvider(process.env.NETWORK, process.env.INFURA_ID)

export const getNewMulticallProvider = (provider: InfuraProvider) => new providers.MulticallProvider(provider)

export const getNewContract = (address: string, abi: string[], provider: Web3Provider | MulticallProvider) =>
  new Contract(address, abi, provider)

export const getVaultContract = (address: string, provider: Web3Provider | MulticallProvider) =>
  getNewContract(address, VAULT_ABI, provider)

export const getVaultContracts = (provider: Web3Provider | MulticallProvider) =>
  VAULT_TOKENS.map((address) => getVaultContract(address, provider))

export const getComptrollerContract = (provider: Web3Provider | MulticallProvider) =>
  getNewContract(COMPTROLLER, COMPTROLLER_ABI, provider)

export const getAnchorContract = (address: string, provider: Web3Provider | MulticallProvider) =>
  getNewContract(address, CTOKEN_ABI, provider)

export const getAnchorContracts = (provider: Web3Provider | MulticallProvider) =>
  ANCHOR_TOKENS.map((address) => getAnchorContract(address, provider))

export const getStabilizerContract = (provider: Web3Provider | MulticallProvider) =>
  getNewContract(STABILIZER, STABILIZER_ABI, provider)

export const getGovernanceContract = (provider: Web3Provider | MulticallProvider) =>
  getNewContract(GOVERNANCE, GOVERNANCE_ABI, provider)

export const getHarvesterContract = (provider: Web3Provider | MulticallProvider) =>
  getNewContract(HARVESTER, HARVESTER_ABI, provider)

export const getINVContract = (provider: Web3Provider | MulticallProvider) => getNewContract(INV, INV_ABI, provider)

export const getXINVContract = (provider: Web3Provider | MulticallProvider) => getNewContract(XINV, XINV_ABI, provider)
