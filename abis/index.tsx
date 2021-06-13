export const VAULT_ABI = [
  'function totalSupply() external view returns (uint256)',
  'function underlying() external view returns (address)',
]

export const COMPTROLLER_ABI = ['function getAllMarkets() public view returns (address[])']

export const CTOKEN_ABI = [
  'function underlying() external view returns (address)',
  'function getCash() external view returns (uint256)',
  'function supplyRatePerBlock() external view returns (uint)',
  'function borrowRatePerBlock() external view returns (uint)',
  'function balanceOf(address) external view returns (uint256)',
]

export const STABILIZER_ABI = ['function supply() view external returns (uint256)']

export const GOVERNANCE_ABI = [
  'function proposalCount() public view returns (uint256)',
  'function proposals(uint256) public view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, bool canceled, bool executed)',
]

export const XINV_ABI = [
  'function underlying() external view returns (address)',
  'function getCash() external view returns (uint256)',
  'function rewardPerBlock() view external returns (uint256)',
  'function exchangeRateStored() public view returns (uint)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
]
