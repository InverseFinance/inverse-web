import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks';
import { BONDS } from '@app/variables/tokens';
import { INTEREST_MODEL } from './constants';

// TODO: Clean-up ABIs
export const COMPTROLLER_ABI = [
  "function claimComp(address) public",
  "function claimComp(address holder,address[] cTokens) public",
  "function compBorrowerIndex(address, address) public view returns (uint256)",
  "function compBorrowState(address) public view returns (uint224, uint32)",
  "function compSpeeds(address) public view returns (uint256)",
  "function compSupplierIndex(address, address) public view returns (uint256)",
  "function compSupplyState(address) public view returns (uint224, uint32)",
  "function enterMarkets(address[]) returns (uint[])",
  "function exitMarket(address) returns (uint256)",
  "function getAccountLiquidity(address) external view returns (uint256, uint256, uint256)",
  "function getAllMarkets() public view returns (address[])",
  "function getAssetsIn(address) view returns (address[])",
  "function markets(address) external view returns (bool, uint256, bool)",
  "function borrowGuardianPaused(address) external view returns (bool)",
  "function mintGuardianPaused(address) external view returns (bool)",
  "function pauseGuardian() public view returns (address)",
  "function admin() public view returns (address)",
  "function liquidationIncentiveMantissa() public view returns (uint256)",
  "function liquidateCalculateSeizeTokens(address ctokenBorrowed, address ctokenSeize, uint256 repayAmount) public view returns (uint256, uint256)",
];

export const ORACLE_ABI = ['function getUnderlyingPrice(address) public view returns (uint)']

export const CTOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function borrow(uint256) returns (uint256)",
  "function borrowBalanceStored(address) external view returns (uint256)",
  "function borrowIndex() public view returns (uint256)",
  "function borrowRatePerBlock() external view returns (uint256)",
  "function exchangeRateCurrent() public view returns (uint256)",
  "function exchangeRateStored() public view returns (uint256)",
  "function getCash() external view returns (uint256)",
  "function mint(uint256) returns (uint256)",
  "function redeemUnderlying(uint256) returns (uint256)",
  "function redeem(uint256) returns (uint256)",
  "function repayBorrow(uint256) returns (uint256)",
  "function supplyRatePerBlock() external view returns (uint256)",
  "function totalBorrowsCurrent() external view returns (uint256)",
  "function totalBorrows() external view returns (uint256)",
  "function totalReserves() external view returns (uint256)",
  'function totalSupply() external view returns (uint256)',
  "function reserveFactorMantissa() external view returns (uint256)",
  "function underlying() external view returns (address)",
  "function decimals() view returns (uint8)",
  "function liquidateBorrow(address account, uint256 amount, address ctoken) external returns (uint)",
  "event Failure(uint256 error, uint256 info, uint256 detail)",
];

export const CETHER_ABI = [
  "function borrow(uint256) returns (uint256)",
  "function mint() payable",
  "function redeemUnderlying(uint256) returns (uint256)",
  "function redeem(uint256) returns (uint256)",
  "function repayBorrow() payable",
  "function balanceOf(address) external view returns (uint256)",
  "function liquidateBorrow(uint256 amount, address account, address ctoken) external returns (uint)",
  "event Failure(uint256 error, uint256 info, uint256 detail)",
];

export const AN_CHAIN_COIN_REPAY_ALL_ABI = [
  "function repayAll() payable",
];

export const ERC20_ABI = [
  "function allowance(address, address) external view returns (uint256)",
  "function approve(address, uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
];

export const DOLA_ABI = ERC20_ABI.concat([
  "function operator() public view returns(address)",
])

export const FAUCET_ABI = [
  // will depend on contract
];

export const ESCROW_ABI = [
  'function pendingWithdrawals(address user) public view returns (uint withdrawalTimestamp, uint amount)',
  'function withdraw() public',
  'function duration() public returns (uint)',
  'function governance() public view returns (address)',
]

export const HARVESTER_ABI = [
  "function ratePerToken(address) external view returns (uint256)",
];

export const INV_ABI = ERC20_ABI.concat([
  "function delegate(address)",
  "function delegates(address) external view returns (address)",
  "function getCurrentVotes(address) external view returns (uint96)",
  "function getPriorVotes(address, uint256) external view returns (uint96)",
  "function nonces(address) external view returns (uint256)",
  "function exchangeRateCurrent() external returns (uint256)",
  "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
  "event DelegateVotesChanged(address indexed delegate, uint previousBalance, uint newBalance)",
]);

export const GOVERNANCE_ABI = [
  "function xinvExchangeRates(uint256) public view returns (uint256)",
  "function proposalThreshold() public view returns (uint256)",
  "function castVote(uint256, bool)",
  "function getReceipt(uint256, address) public view returns (bool, bool, uint256)",
  "function proposalCount() public view returns (uint256)",
  "function proposals(uint256) public view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, bool canceled, bool executed)",
  "function quorumVotes() public view returns (uint256)",
  "function state(uint256) public view returns (uint256)",
  "function queue(uint256)",
  "function execute(uint256)",
  "function guardian() public view returns (address)",
  "function inv() public view returns (address)",
  "function xinv() public view returns (address)",
  "function timelock() public view returns (address)",
  "function propose(address[] targets, uint256[] values, string[] signatures, bytes[] calldata, string description) public returns (uint)",
  "event ProposalCreated (uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
  "event VoteCast (address voter, uint256 proposalId, bool support, uint256 votes)",
];

export const LENS_ABI = [
  "function getCompBalanceMetadataExt(address, address, address) returns (uint256, uint256, uint256, uint256)",
];
export const STABILIZER_ABI = [
  "function buy(uint256)",
  "function sell(uint256)",
  "function supply() external view returns (uint256)",
  "event Buy (address indexed user, uint256 purchased, uint256 spent)",
  "event Sell (address indexed user, uint256 sold, uint256 received)",
];

export const XINV_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function exchangeRateStored() public view returns (uint256)",
  "function getCash() external view returns (uint256)",
  "function rewardPerBlock() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function underlying() external view returns (address)",
  "function getCurrentVotes(address) external view returns (uint96)",
  "function getPriorVotes(address, uint256) external view returns (uint96)",
  "function delegate(address)",
  "function delegates(address) external view returns (address)",
  "function admin() public view returns (address)",
  "function escrow() public view returns (address)",
  "function comptroller() public view returns (address)",
];

export const TREASURY_ABI = [
  "function admin() public view returns (address)",
];

export const MULTIDELEGATOR_ABI = [
  "function inv() external view returns (address)",
  "function delegateBySig(address delegatee, address[] delegator, uint256[] nonce, uint256[] expiry, uint8[] v, bytes32[] r, bytes32[] s)",
];

export const DOLA3POOLCRV_ABI = [
  /*  @param i Index value for the underlying coin to send
  *   @param j Index value of the underlying coin to receive
  *   @param _dx Amount of `i` being exchanged
  *   @param _min_dy Minimum amount of `j` to receive
  *   indexes DOLA = 0, DAI = 1, USDC = 2, USDT = 3
  */
  "function exchange_underlying(int128 i, int128 j, uint256 _dx, uint256 _min_dy) external returns (uint256)",
  "function get_dy_underlying(int128 i, int128 j, uint256 _dx) external view returns (uint256)",
];

export const FED_ABI = [
  "function chair() public view returns (address)",
  "function ctoken() public view returns (address)",
  "function gov() public view returns (address)",
  "function underlying() public view returns (address)",
  "function supply() public view returns (uint256)",
  "event Expansion (uint256 amount)",
  "event Contraction (uint256 amount)",
]

// Cross-chain fed contract
export const XCHAIN_FED_ABI = [
  "function chair() public view returns (address)",
  "function dstIsChairSuspended() public view returns (address)",
  "function dstBoard() public view returns (address)",
  "function dstSupply() public view returns (uint256)",
  "function dstLastSuspendTimestamp() public view returns (uint256)",
  "function GOV() public view returns (address)",
  "function SRC_BRIDGE() public view returns (address)",
  "function SRC_DOLA() public view returns (address)",
  "function DST_DOLA() public view returns (address)",
  "function DST_MARKET() public view returns (address)",
  "event Expansion (uint256 amount)",
  "event Contraction (uint256 amount)",
]

export const MULTISIG_ABI = [
  "function getOwners() public view returns (address[])",
  "function getThreshold() public view returns (uint256)",
]

export const INTEREST_MODEL_ABI = [
  "function blocksPerYear() public view returns (uint256)",
  "function jumpMultiplierPerBlock() public view returns (uint256)",
  "function kink() public view returns (uint256)",
  "function multiplierPerBlock() public view returns (uint256)",
  "function baseRatePerBlock() public view returns (uint256)",
]

export const DOLA_PAYROLL_ABI = [
  "function balanceOf(address) public view returns (uint256)",
  "function recipients(address) public view returns (uint256, uint256, uint256)",
  "function withdraw() external",
  "event AmountWithdrawn(address recipient, uint256 amount)",
]

const BASE_BOND_ABI = [
  "function bondInfo(address depositor) public view returns (uint256, uint256, uint256, uint256)",
  "function pendingPayoutFor(address depositor) public view returns (uint256)",
  "function percentVestedFor(address depositor) public view returns (uint256)",
  "function terms() public view returns (uint256, uint256, uint256, uint256, uint256)",
  "function trueBondPrice() public view returns (uint256)",
  "function deposit(uint256 amount, uint256 maxPrice, address depositor) external returns (uint256)",
  "function redeem(address depositor) external returns (uint256)",
  "function maxPayout() public view returns (uint256)",
]

export const BOND_ABI = BASE_BOND_ABI.concat([
  "function payoutFor(uint256 value) public view returns (uint256, uint256)",
]);

export const BOND_ABI_VARIANT = BASE_BOND_ABI.concat([
  "function payoutFor(uint256 value) public view returns (uint256)",
]);

const BONDS_ABIS = [BOND_ABI, BOND_ABI_VARIANT];

export const VESTER_FACTORY_ABI = [
  "function vesters(uint256) public view returns (address)",
]

export const VESTER_ABI = [
  "function recipient() public view returns (address)",
  "function governance() public view returns (address)",
  "function factory() public view returns (address)",
  "function vestingXinvAmount() public view returns (uint256)",
  "function vestingBegin() public view returns (uint256)",
  "function vestingEnd() public view returns (uint256)",
  "function lastUpdate() public view returns (uint256)",
  "function isCancellable() public view returns (bool)",
  "function isCancelled() public view returns (bool)",

  "function claimableXINV() public view returns (uint256)",
  "function claimableINV() public view returns (uint256)",

  "function delegate(address delegate_) public",
  "function setRecipient(address delegate_) public",
  "function claim() public",
  "function cancel() public",
]

export const SWAP_ROUTER_ABI = [
  "function get_dy_underlying_routed(int128[] memory ij, address[] memory path, uint256 dx) external view returns (uint256)",
  "function find_coin_routes(address _from, address _to) external view returns(int128[] memory, address[] memory)",
  "function exchange_underlying_routed( int128[] memory ij, address[] memory path, uint256 _dx, uint256 _min_dy, address _receiver ) external returns (uint256)",
]

export const getAbis = (chainId = process.env.NEXT_PUBLIC_CHAIN_ID!): Map<string, string[]> => {
  const networkConfig = getNetworkConfig(chainId, true)!;
  const {
    ANCHOR_TOKENS,
    COMPTROLLER,
    ESCROW_OLD,
    ESCROW,
    GOVERNANCE,
    GOVERNANCE_ALPHA,
    HARVESTER,
    INV,
    LENS,
    AN_CHAIN_COIN_REPAY_ALL,
    ORACLE,
    TOKENS,
    XINV_V1,
    XINV,
    DOLA3POOLCRV,
    TREASURY,
    DOLA,
    FEDS,
    MULTISIGS,
    DOLA_PAYROLL,
    XINV_VESTOR_FACTORY,
    VESTERS,
    SWAP_ROUTER,
  } = getNetworkConfigConstants(networkConfig);

  return new Map<string, string[]>(
    // @ts-ignore
    ANCHOR_TOKENS.map((address) => [address, CTOKEN_ABI]).concat(
      [
        [XINV_V1, XINV_ABI],
        [XINV, XINV_ABI],
        [COMPTROLLER, COMPTROLLER_ABI],
        [ESCROW_OLD, ESCROW_ABI],
        [ESCROW, ESCROW_ABI],
        [HARVESTER, HARVESTER_ABI],
        [GOVERNANCE, GOVERNANCE_ABI],
        [GOVERNANCE_ALPHA, GOVERNANCE_ABI],
        [LENS, LENS_ABI],
        [AN_CHAIN_COIN_REPAY_ALL, AN_CHAIN_COIN_REPAY_ALL_ABI],
        [ORACLE, ORACLE_ABI],
        [DOLA3POOLCRV, DOLA3POOLCRV_ABI],
        [TREASURY, TREASURY_ABI],
        [INTEREST_MODEL, INTEREST_MODEL_ABI],
        [DOLA_PAYROLL, DOLA_PAYROLL_ABI],
        [XINV_VESTOR_FACTORY, VESTER_FACTORY_ABI],
        [SWAP_ROUTER, SWAP_ROUTER_ABI],
        ...VESTERS.map(vesterAd => [vesterAd, VESTER_ABI]),
        ...FEDS.map((fed) => [fed.address, fed.abi]),
        ...MULTISIGS.map((m) => [m.address, MULTISIG_ABI]),
        ...Object.values(BONDS).map((bond) => [bond.bondContract, BONDS_ABIS[bond.abiType]]),
      ],
      Object.keys(TOKENS).map((address) => [address, address === INV ? INV_ABI : address === DOLA ? DOLA_ABI : ERC20_ABI])
    )
  )
}