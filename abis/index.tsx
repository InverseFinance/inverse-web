import {
  ANCHOR_TOKENS,
  COMPTROLLER,
  DOLA3CRV,
  GOVERNANCE,
  HARVESTER,
  INV,
  LENS,
  TOKENS,
  VAULT_TOKENS,
  XINV,
} from '@inverse/config'

// TODO: Clean-up ABIs
export const COMPTROLLER_ABI = [
  'function claimComp(address) public',
  'function compBorrowerIndex(address, address) public view returns (uint256)',
  'function compBorrowState(address) public view returns (uint224, uint32)',
  'function compSpeeds(address) public view returns (uint256)',
  'function compSupplierIndex(address, address) public view returns (uint256)',
  'function compSupplyState(address) public view returns (uint224, uint32)',
  'function enterMarkets(address[]) returns (uint[])',
  'function exitMarket(address) returns (uint256)',
  'function getAccountLiquidity(address) external view returns (uint256, uint256, uint256)',
  'function getAllMarkets() public view returns (address[])',
  'function getAssetsIn(address) view returns (address[])',
  'function markets(address) external view returns (bool, uint256, bool)',
]

export const CTOKEN_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function borrow(uint256) returns (uint256)',
  'function borrowBalanceStored(address) external view returns (uint256)',
  'function borrowIndex() public view returns (uint256)',
  'function borrowRatePerBlock() external view returns (uint256)',
  'function exchangeRateCurrent() public view returns (uint256)',
  'function exchangeRateStored() public view returns (uint256)',
  'function getCash() external view returns (uint256)',
  'function mint(uint256) returns (uint256)',
  'function redeemUnderlying(uint256) returns (uint256)',
  'function repayBorrow(uint256) returns (uint256)',
  'function supplyRatePerBlock() external view returns (uint256)',
  'function totalBorrowsCurrent() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function underlying() external view returns (address)',
]

export const CETHER_ABI = [
  'function borrow(uint256) returns (uint256)',
  'function mint() payable',
  'function redeemUnderlying(uint256) returns (uint256)',
  'function repayBorrow() payable',
]

export const ERC20_ABI = [
  'function allowance(address, address) external view returns (uint256)',
  'function approve(address, uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
]

export const HARVESTER_ABI = ['function ratePerToken(address) external view returns (uint256)']

export const INV_ABI = [
  'function allowance(address, address) external view returns (uint256)',
  'function approve(address, uint256)',
  'function balanceOf(address) external view returns (uint256)',
  'function delegate(address)',
  'function delegates(address) external view returns (address)',
  'function getCurrentVotes(address) external view returns (uint96)',
  'function nonces(address) external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
  'event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)',
  'event DelegateVotesChanged(address indexed delegate, uint previousBalance, uint newBalance)',
]

export const GOVERNANCE_ABI = [
  'function castVote(uint256, bool)',
  'function getReceipt(uint256, address) public view returns (bool, bool, uint256)',
  'function proposalCount() public view returns (uint256)',
  'function proposals(uint256) public view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, bool canceled, bool executed)',
  'function quorumVotes() public view returns (uint256)',
  'function state(uint256) public view returns (uint256)',
  'event ProposalCreated (uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
  'event VoteCast (address voter, uint256 proposalId, bool support, uint256 votes)',
]

export const LENS_ABI = [
  'function getCompBalanceMetadataExt(address, address, address) returns (uint256, uint256, uint256, uint256)',
]
export const STABILIZER_ABI = [
  'function buy(uint256)',
  'function sell(uint256)',
  'function supply() external view returns (uint256)',
]

export const STAKING_ABI = [
  'function balanceOf() external view returns (uint256)',
  'function earned(address) external view returns (uint256)',
  'function getReward()',
  'function stake(uint256)',
  'function withdraw(uint256)',
]

export const VAULT_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function claim()',
  'function claimETH()',
  'function deposit(uint256)',
  'function lastDistribution() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function unclaimedProfit(address) external view returns (uint256)',
  'function underlying() external view returns (address)',
  'function withdrraw(uint256)',
]

export const XINV_ABI = [
  'function balanceOf(address) external view returns (uint256)',
  'function exchangeRateStored() public view returns (uint256)',
  'function getCash() external view returns (uint256)',
  'function rewardPerBlock() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function underlying() external view returns (address)',
]

export const ABIs = new Map<string, string[]>(
  // @ts-ignore
  ANCHOR_TOKENS.map((address) => [address, CTOKEN_ABI]).concat(
    [
      [XINV, XINV_ABI],
      [COMPTROLLER, COMPTROLLER_ABI],
      [HARVESTER, HARVESTER_ABI],
      [GOVERNANCE, GOVERNANCE_ABI],
      [LENS, LENS_ABI],
      [DOLA3CRV, STAKING_ABI],
      ...VAULT_TOKENS.map((address) => [address, VAULT_ABI]),
    ],
    Object.keys(TOKENS).map((address) => [address, address === INV ? INV_ABI : ERC20_ABI])
  )
)
