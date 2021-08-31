import { InfuraProvider, JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
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
  CETHER_ABI,
  ERC20_ABI,
  STAKING_ABI,
  LENS_ABI,
  ESCROW_ABI,
  GUARD_ABI
} from '@inverse/abis'
import { providers } from '@0xsequence/multicall'
import {
  ANCHOR_TOKENS,
  STABILIZER,
  COMPTROLLER,
  GOVERNANCE,
  VAULT_TOKENS,
  XINV,
  INV,
  HARVESTER,
  LENS,
  ESCROW,
  NETWORK,
  GUARD
} from '@inverse/config'
import { MulticallProvider } from '@0xsequence/multicall/dist/declarations/src/providers'

export const getNewProvider = () => new InfuraProvider(NETWORK, process.env.INFURA_ID)

export const getNewMulticallProvider = (provider: InfuraProvider) => new providers.MulticallProvider(provider)

export const getNewContract = (
  address: string,
  abi: string[],
  provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined
) => new Contract(address, abi, provider)

export const getVaultContract = (
  address: string,
  provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined
) => getNewContract(address, VAULT_ABI, provider)

export const getVaultContracts = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  VAULT_TOKENS.map((address) => getVaultContract(address, provider))

export const getComptrollerContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(COMPTROLLER, COMPTROLLER_ABI, provider)

export const getAnchorContract = (
  address: string,
  provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined
) => getNewContract(address, CTOKEN_ABI, provider)

export const getAnchorContracts = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  ANCHOR_TOKENS.map((address) => getAnchorContract(address, provider))

export const getStabilizerContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(STABILIZER, STABILIZER_ABI, provider)

export const getGovernanceContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(GOVERNANCE, GOVERNANCE_ABI, provider)

export const getHarvesterContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(HARVESTER, HARVESTER_ABI, provider)

export const getEscrowContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(ESCROW, ESCROW_ABI, provider)

export const getINVContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(INV, INV_ABI, provider)

export const getXINVContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(XINV, XINV_ABI, provider)

export const getCEtherContract = (
  address: string,
  provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined
) => getNewContract(address, CETHER_ABI, provider)

export const getERC20Contract = (
  address: string,
  provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined
) => getNewContract(address, ERC20_ABI, provider)

export const getStakingContract = (
  address: string,
  provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined
) => getNewContract(address, STAKING_ABI, provider)

export const getLensContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(LENS, LENS_ABI, provider)

export const getGuardContract = (provider: Web3Provider | MulticallProvider | JsonRpcSigner | undefined) =>
  getNewContract(GUARD, GUARD_ABI, provider)