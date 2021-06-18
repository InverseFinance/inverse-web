import { ANCHOR_TOKENS, COMPTROLLER, TOKENS, XINV } from '@inverse/constants'

export const COMPTROLLER_ABI = [
  'function getAllMarkets() public view returns (address[])',
  'function getAccountLiquidity(address) external view returns (uint256, uint256, uint256)',
  'function getHypotheticalAccountLiquidity(address, address, uint256, uint256) external view returns (uint256, uint256, uint256)',
  'function markets(address) external view returns (bool, uint256, bool)',
]

export const CTOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function borrowBalanceStored(address) external view returns (uint256)',
  'function borrowRatePerBlock() external view returns (uint)',
  'function exchangeRateStored() public view returns (uint)',
  'function getCash() external view returns (uint256)',
  'function supplyRatePerBlock() external view returns (uint)',
  'function underlying() external view returns (address)',
]

export const ERC20_API = ['function balanceOf(address) external view returns (uint256)']

export const GOVERNANCE_ABI = [
  'function proposalCount() public view returns (uint256)',
  'function proposals(uint256) public view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, bool canceled, bool executed)',
]

export const STABILIZER_ABI = ['function supply() view external returns (uint256)']

export const VAULT_ABI = [
  'function totalSupply() external view returns (uint256)',
  'function underlying() external view returns (address)',
]

export const XINV_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function exchangeRateStored() public view returns (uint)',
  'function getCash() external view returns (uint256)',
  'function rewardPerBlock() view external returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function underlying() external view returns (address)',
]

export const ABIs = new Map<string, any>(
  // @ts-ignore
  ANCHOR_TOKENS.map((address) => [address, CTOKEN_ABI]).concat(
    [
      [XINV, XINV_ABI],
      [COMPTROLLER, COMPTROLLER_ABI],
    ],
    Object.keys(TOKENS).map((address) => [address, ERC20_API])
  )
)
