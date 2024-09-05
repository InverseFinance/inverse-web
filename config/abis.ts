import { getNetworkConfig, getNetworkConfigConstants } from '@app/util/networks';
import { BOND_V2_AGGREGATOR, BOND_V2_FIXED_TERM, BOND_V2_FIXED_TERM_TELLER } from '@app/variables/bonds';
import { BONDS } from '@app/variables/tokens';
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS, DOLA_SAVINGS_ADDRESS, DWF_PURCHASER, SDOLA_ADDRESS, SDOLA_HELPER_ADDRESS, SINV_ADDRESS, SINV_ESCROW_ADDRESS, SINV_HELPER_ADDRESS } from './constants';

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
  "function collateralGuardianPaused(address) external view returns (bool)",
  "function pauseGuardian() public view returns (address)",
  "function admin() public view returns (address)",
  "function liquidationIncentiveMantissa() public view returns (uint256)",
  "function liquidateCalculateSeizeTokens(address ctokenBorrowed, address ctokenSeize, uint256 repayAmount) public view returns (uint256, uint256)",
];

export const ORACLE_ABI = [
  'function getUnderlyingPrice(address) public view returns (uint)',
  'function feeds(address) public view returns (address)',
]

export const CTOKEN_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function allowance(address, address) external view returns (uint256)",
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
  "function interestRateModel() view returns (address)",
  "function liquidateBorrow(address account, uint256 amount, address ctoken) external returns (uint)",
  "function getAccountSnapshot(address account) external view returns (uint, uint, uint, uint)",
  "event Failure(uint256 error, uint256 info, uint256 detail)",
  "event RepayBorrow(address payer, address borrower, uint repayAmount, uint accountBorrows, uint totalBorrows)",
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
  "function symbol() external view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
];

export const DOLA_ABI = ERC20_ABI.concat([
  "function operator() public view returns(address)",
])

export const WETH_ABI = ERC20_ABI.concat([
  "function deposit() public payable",
  "function withdraw(uint) public",
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
  "function delegateBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) public",
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
  "function proposerWhitelist(address) public view returns (bool)",
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
  "function updateProposerWhitelist(address proposer, bool value) public",
  "event ProposalExecuted (uint256 id)",
  "event ProposalCreated (uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
  "event VoteCast (address voter, uint256 proposalId, bool support, uint256 votes)",
];

export const LENS_ABI = [
  "function getCompBalanceMetadataExt(address, address, address) returns (uint256, uint256, uint256, uint256)",
];
export const STABILIZER_ABI = [
  "function buy(uint256)",
  "function sell(uint256)",
  "function buyFee() public view returns (uint)",
  "function sellFee() public view returns (uint)",
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
  "function delegateBySig(address delegatee, address[] delegator, uint[] nonce, uint[] expiry, uint8[] v, bytes32[] r, bytes32[] s)",
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
  "function get_virtual_price() external view returns (uint256)",
  "function lp_price() external view returns (uint256)",
  "function balances(uint) external view returns (uint256)",
];

export const FED_ABI = [
  "function chair() public view returns (address)",
  "function ctoken() public view returns (address)",
  "function gov() public view returns (address)",
  "function underlying() public view returns (address)",
  "function supply() public view returns (uint256)",
  // dolaSupply instead of supply for Convex Fed only
  "function dolaSupply() public view returns (uint256)",
  "function underlyingSupply() public view returns (uint256)",
  "event Expansion (uint256 amount)",
  "event Contraction (uint256 amount)",
]

export const FIRM_FED_ABI = [
  "function chair() public view returns (address)",
  "function gov() public view returns (address)",
  "function globalSupply() public view returns (uint256)",
  "function ceilings(address) public view returns (uint256)",
  "event Expansion (address indexed market, uint256 amount)",
  "event Contraction (address indexed market, uint256 amount)",
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
  "event NewRecipient(address recipient, uint256 _yearlyAmount)",
  "event RecipientRemoved(address recipient, uint256 amount)",
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
  "event BondCreated(uint256 deposit, uint256 payout, uint256 expires)",
  "event BondRedeemed(address recipient, uint256 payout, uint256 remaining)",
]

export const BOND_ABI = BASE_BOND_ABI.concat([
  "function payoutFor(uint256 value) public view returns (uint256, uint256)",
]);

export const BOND_ABI_VARIANT = BASE_BOND_ABI.concat([
  "function payoutFor(uint256 value) public view returns (uint256)",
]);

export const BONDS_ABIS = [BOND_ABI, BOND_ABI_VARIANT];

/*
address owner; // market owner. sends payout tokens, receives quote tokens (defaults to creator)
ERC20 payoutToken; // token to pay depositors with
ERC20 quoteToken; // token to accept as payment
address callbackAddr; // address to call for any operations on bond purchase. Must inherit to IBondCallback.
bool capacityInQuote; // capacity limit is in payment token (true) or in payout (false, default)
uint256 capacity; // capacity remaining
uint256 totalDebt; // total payout token debt from market
uint256 minPrice; // minimum price (debt will stop decaying to maintain this)
uint256 maxPayout; // max payout tokens out in one order
uint256 sold; // payout tokens out
uint256 purchased; // quote tokens in
uint256 scale; // scaling factor for the market (see MarketParams struct)
*/
const BOND_MARKET = 'tuple(address, address, address, address, bool, uint, uint, uint, uint, uint, uint, uint)';
// Auctioneer
export const BOND_V2_ABI = [
  `function getTeller() public view returns (address)`,
  `function markets(uint) public view returns (${BOND_MARKET})`,
  `function adjusments(uint) public view returns (uint change, uint lastAdjusment, uint timeToAdjusted, bool active)`,
  `function marketPrice(uint) public view returns (uint)`,
  `function payoutFor(uint amount, uint id, address referrer) public view returns (uint)`,
  `function terms(uint) public view returns (uint controlVar, uint maxDebt, uint vesting, uint conclusion)`,
  `function purchaseBond(uint id, uint amount, uint minAmountOut) external returns (uint)`,
  `event MarketCreated (uint indexed id, address indexed payoutToken, address indexed quoteToken, uint vesting, uint initialPrice)`,
]

export const BOND_V2_FIXED_TELLER_ABI = [
  `function purchase(address rec, address ref, uint id, uint amount, uint minAmountOut) external returns (uint, uint)`,
  `function redeem(uint tokenId, uint amount) public`,
  "function tokenMetadata(uint) public view returns (tuple(bool, address, uint, uint, uint))",
  "function balanceOf(address, uint) public view returns (uint)",
  "function getTokenNameAndSymbol(uint) public view returns (string, string)",
  "event TransferSingle (address indexed operator, address indexed from, address indexed to, uint256 id, uint256 amount)",
  "event Bonded (uint indexed id, address indexed ref, uint amount, uint payout)",
]

export const BOND_V2_AGGREGATOR_ABI = [
  "function liveMarketsFor(address, bool isPayout) public view returns (uint256[])",
  "function marketsFor(address, address) public view returns (uint256[])",
  `function getTeller(uint) public view returns (address)`,
  `function getAuctioneer(uint) public view returns (address)`,
  `function marketPrice(uint) public view returns (uint)`,
]

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

export const DISPERSE_APP_ABI = [
  "function disperseEther(address[] recipients, uint256[] values) external payable",
  "function disperseToken(address token, address[] recipients, uint256[] values) external",
  "function disperseTokenSimple(address token, address[] recipients, uint256[] values) external",
]

export const DEBT_REPAYER_ABI = [
  "function sellDebt(address anToken, uint amount, uint minOut) public",
  "function amountOut(address anToken, address underlying, uint amount) public view returns(uint, uint)",
  "function currentDiscount(address anToken) public view returns(uint)",
  "function remainingDebt(address anToken) public view returns(uint)",
  "function convertToUnderlying(address anToken, uint amount) public view returns(uint)",
  "event debtRepayment(address underlying, uint receiveAmount, uint paidAmount)",
]

export const DEBT_CONVERTER_ABI = ERC20_ABI.concat([
  "function conversions(address user, uint conversionIndex) public view returns (tuple(uint lastEpochRedeemed, uint dolaIOUAmount, uint dolaIOUsRedeemed))",
  "function outstandingDebt() public view returns (uint)",
  "function owner() public view returns (address)",
  "function maxConvertPrice(address anToken) public view returns (uint)",
  "function repaymentEpoch() public view returns (uint)",
  "function convert(address anToken, uint amount, uint minOut) external",
  "function repayment(uint amount) external",
  "function redeemConversion(uint _conversion, uint _endEpoch) public",
  "function redeemConversionDust(uint _conversion) public",
  "function redeemAll(uint _conversion) external",
  "function getRedeemableDolaIOUsFor(address _addr, uint _conversion, uint _epoch) public view returns (uint)",
  "function getRedeemableDolaFor(address _addr, uint _conversion, uint _epoch) public view returns (uint)",
  "function convertDolaIOUsToDola(uint dolaIOUs) public view returns (uint)",
  "function convertDolaToDolaIOUs(uint dola) public view returns (uint)",
  "function balanceOfDola(address _addr) external view returns (uint)",
  "function exchangeRateMantissa() external view returns (uint)",
  "function exchangeRateIncreasePerSecond() public view returns (uint)",
  "function cumDebt() public view returns (uint)",
  "function cumDolaRepaid() public view returns (uint)",
  "event NewOwner(address owner)",
  "event NewTreasury(address treasury)",
  "event NewGovernance(address governance)",
  "event NewTransferWhitelistAddress(address whitelistedAddr)",
  "event NewAnnualExchangeRateIncrease(uint increase)",
  "event Repayment(uint dolaAmount, uint epoch)",
  "event Redemption(address indexed user, uint dolaAmount)",
  "event Conversion(address indexed user, address indexed anToken, uint epoch, uint dolaAmount, uint underlyingAmount)",
]);

export const BALANCER_VAULT_ABI = [
  "function getPoolTokens(bytes32 poolId) public view returns (address[], uint256[], uint256)"
]

export const DBR_ABI = ERC20_ABI.concat([
  "function balances(address) public view returns (uint)",
  "function totalDueTokensAccrued() public view returns (uint)",
  "function markets(address) public view returns (bool)",
  "function debts(address) public view returns (uint)",
  "function dueTokensAccrued(address) public view returns (uint)",
  "function lastUpdated(address) public view returns (uint)",
  "function deficitOf(address) public view returns (uint)",
  "function signedBalanceOf(address) public view returns (int)",
  "function replenishmentPriceBps() public view returns (uint)",
  "function operator() public view returns (address)",
  "event ForceReplenish(address indexed account, address indexed replenisher, address indexed market, uint deficit, uint replenishmentCost, uint replenisherReward)",
  "event AddMinter(address minter)",
  "event AddMarket(address market)",
]);

export const F2_ORACLE_ABI = [
  "function getPrice(address collateral, uint collateralFactorBps) external returns (uint)",
  "function viewPrice(address collateral, uint collateralFactorBps) public view returns (uint)",
  "function feeds(address collateral) public view returns (address, uint)",
];

export const F2_ESCROW_ABI = [
  "function balance() public view returns (uint)",
  "function beneficiary() public view returns (address)",
  // gov escrow like gOHM
  "function delegatingTo() public view returns (address)",
  "function delegate(address) public",
  // escrows with claimable rewards
  "function rewardPool() public view returns(address)",
  "function claim() public",
  "function claimTo(address) public",
  "function claimTo(address, address[] extraRewards) public",
  "function allowClaimOnBehalf(address) public",
  "function disallowClaimOnBehalf(address) public",
  // only cvxCRV
  "function setRewardWeight(uint) public",
  // only INV
  'function claimable() public view returns (uint)',
  "function claimDBR() public",
  "function claimDBRTo() public",
  "function setClaimer(address, bool) public",
  "function claimers(address) public view returns (bool)",
];

export const F2_CONTROLLER_ABI = [
  "function dailyLimits(address market) public view returns (uint)",
  "function dailyBorrows(address market, uint day) public view returns (uint)",
  "function contractAllowlist(address market) public view returns (bool)",
  "function minDebts(address market) public view returns (uint)",
  "function isPriceStale(address market) public view returns (boolean)",
  "function isBelowMinDebt(address market, address borrower, uint amount) public view returns(bool)",
];

export const F2_MARKET_ABI = [
  "function nonces(address) public view returns (uint)",
  "function borrowController() public view returns (address)",
  "function collateral() public view returns (address)",
  "function collateralFactorBps() public view returns (uint)",
  "function replenishmentIncentiveBps() public view returns (uint)",
  "function liquidationIncentiveBps() public view returns (uint)",
  "function oracle() public view returns (address)",
  "function borrowPaused() public view returns (bool)",
  "function totalDebt() public view returns (uint)",
  "function escrows(address) public view returns (address)",
  "function debts(address) public view returns (uint)",
  "function predictEscrow(address user) public view returns (address)",
  "function getCreditLimit(address user) public view returns (uint)",
  "function getWithdrawalLimit(address user) public view returns (uint)",
  "function getCollateralValue(address user) public view returns (uint)",
  // "function deposit(uint amount) public",
  "function deposit(address user, uint amount) public",
  "function borrow(uint amount) public",
  "function withdraw(uint amount) public",
  "function liquidationFactorBps() public view returns (uint)",
  "function repay(address user, uint amount) public",
  "function repayAndWithdraw(uint repayAmount, uint withdrawAmount) public",
  "function depositAndBorrow(uint amountDeposit, uint amountBorrow) public",
  "function forceReplenish(address user, uint amount) public",
  "function forceReplenishAll(address user) public",
  "function liquidate(address user, uint repaidDebt) public",
  // withdrawMax: only INV
  "function withdrawMax() public",
  "event Deposit(address indexed account, uint amount)",
  "event Borrow(address indexed account, uint amount)",
  "event Withdraw(address indexed account, address indexed to, uint amount)",
  "event Repay(address indexed account, address indexed repayer, uint amount)",
  "event Liquidate(address indexed account, address indexed liquidator, uint repaidDebt, uint liquidatorReward)",
  "event CreateEscrow(address indexed user, address escrow)",
];

export const F2_HELPER_ABI = [
  "function depositBuyDbrAndBorrowOnBehalf(address market, uint collateralAmount, uint dolaAmount, uint maxDolaIn, uint duration, uint deadline, uint8 v, bytes32 r, bytes32 s) public",
  "function depositNativeEthBuyDbrAndBorrowOnBehalf(address market, uint dolaAmount, uint maxDolaIn, uint duration, uint deadline, uint8 v, bytes32 r, bytes32 s) public payable",
  "function depositNativeEthAndBorrowOnBehalf(address market, uint dolaAmount, uint deadline, uint8 v, bytes32 r, bytes32 s) public payable",
  "function sellDbrAndRepayOnBehalf(address market, uint dolaAmount, uint minDolaFromDbr, uint dbrAmountToSell) public",
  "function sellDbrRepayAndWithdrawOnBehalf(address market, uint dolaAmount, uint minDolaFromDbr, uint dbrAmountToSell, uint collateralAmount, uint deadline, uint8 v, bytes32 r, bytes32 s) public",
  "function sellDbrRepayAndWithdrawNativeEthOnBehalf(address market, uint dolaAmount, uint minDolaFromDbr, uint dbrAmountToSell, uint collateralAmount, uint deadline, uint8 v, bytes32 r, bytes32 s) public",
  "function repayAndWithdrawNativeEthOnBehalf(address market, uint dolaAmount, uint collateralAmount, uint deadline, uint8 v, bytes32 r, bytes32 s) public",
  "function depositNativeEthOnBehalf(address market) public payable",
  "function withdrawNativeEthOnBehalf(address market, uint collateralAmount, uint deadline, uint8 v, bytes32 r, bytes32 s) public",
  "function approximateDolaAndDbrNeeded(uint dolaBorrowAmount, uint period, uint iterations) public view returns(uint, uint)",
  "function buyDbrAndBorrowOnBehalf(address market, uint dolaBorrowAmount, uint maxDebt, uint duration, uint deadline, uint8 v, bytes32 r, bytes32 s) public",
]

export const MERKLE_DROP_ABI = [
  "function verifyClaim(address, uint256, uint256, bytes32[]) public view returns (bool)",
  "function hasClaimed(address, uint256) public view returns (bool)",
  "function claimTranche(address, uint256, uint256, bytes32[]) public",
  "function claimTranches(address, uint256[], uint256[], bytes32[][]) public",
];

export const CONVEX_REWARD_POOL = [
  'function earned(address) public view returns (uint)',
  'function extraRewards(uint) public view returns (address)',
  'function extraRewardsLength() public view returns (uint)',
]

export const DBR_DISTRIBUTOR_ABI = [
  'function rewardRate() public view returns (uint)',
  'function minRewardRate() public view returns (uint)',
  'function maxRewardRate() public view returns (uint)',
  'function lastUpdate() public view returns (uint)',
  'function claimable() public view returns (uint)',
  'function rewardIndexMantissa() public view returns (uint)',
  'function accruedRewards(address) public view returns (uint)',
  'function totalSupply() public view returns (uint)',
  'function operator() public view returns (address)',
]

export const F2_ALE_ABI = [{ "inputs": [{ "internalType": "address", "name": "_exchangeProxy", "type": "address" }, { "internalType": "address", "name": "_pool", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "CollateralIsZero", "type": "error" }, { "inputs": [], "name": "CollateralNotSet", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "expected", "type": "uint256" }, { "internalType": "uint256", "name": "actual", "type": "uint256" }], "name": "DOLAInvalidBorrow", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "expected", "type": "uint256" }, { "internalType": "uint256", "name": "actual", "type": "uint256" }], "name": "DOLAInvalidRepay", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "expected", "type": "uint256" }, { "internalType": "uint256", "name": "actual", "type": "uint256" }], "name": "DepositFailed", "type": "error" }, { "inputs": [], "name": "InvalidHelperAddress", "type": "error" }, { "inputs": [], "name": "InvalidProxyAddress", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "market", "type": "address" }], "name": "MarketNotSet", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "market", "type": "address" }], "name": "NoMarket", "type": "error" }, { "inputs": [], "name": "NothingToDeposit", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" }, { "inputs": [], "name": "ReentrancyGuardReentrantCall", "type": "error" }, { "inputs": [], "name": "SwapFailed", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "expected", "type": "uint256" }, { "internalType": "uint256", "name": "actual", "type": "uint256" }], "name": "TotalSupplyChanged", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "expected", "type": "uint256" }, { "internalType": "uint256", "name": "actual", "type": "uint256" }], "name": "WithdrawFailed", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "market", "type": "address" }, { "internalType": "address", "name": "buySellToken", "type": "address" }, { "internalType": "address", "name": "collateral", "type": "address" }, { "internalType": "address", "name": "helper", "type": "address" }], "name": "WrongCollateral", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "market", "type": "address" }, { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "depositAmount", "type": "uint256" }], "name": "Deposit", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "market", "type": "address" }, { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "dolaFlashMinted", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "collateralSold", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "dolaUserRepaid", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "dbrSoldForDola", "type": "uint256" }], "name": "LeverageDown", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "market", "type": "address" }, { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "dolaFlashMinted", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "collateralDeposited", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "dolaBorrowed", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "dolaForDBR", "type": "uint256" }], "name": "LeverageUp", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "market", "type": "address" }, { "indexed": true, "internalType": "address", "name": "helper", "type": "address" }], "name": "NewHelper", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "market", "type": "address" }, { "indexed": true, "internalType": "address", "name": "buySellToken", "type": "address" }, { "indexed": false, "internalType": "address", "name": "collateral", "type": "address" }, { "indexed": true, "internalType": "address", "name": "helper", "type": "address" }], "name": "NewMarket", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "inputs": [], "name": "DBR", "outputs": [{ "internalType": "contract IDBR", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "dolaBorrowAmount", "type": "uint256" }, { "internalType": "uint256", "name": "period", "type": "uint256" }, { "internalType": "uint256", "name": "iterations", "type": "uint256" }], "name": "approximateDolaAndDbrNeeded", "outputs": [{ "internalType": "uint256", "name": "dolaForDbr", "type": "uint256" }, { "internalType": "uint256", "name": "dbrNeeded", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "curvePool", "outputs": [{ "internalType": "contract ICurvePool", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_value", "type": "uint256" }, { "internalType": "address", "name": "_market", "type": "address" }, { "internalType": "uint256", "name": "_collateralAmount", "type": "uint256" }, { "internalType": "address", "name": "_spender", "type": "address" }, { "internalType": "bytes", "name": "_swapCallData", "type": "bytes" }, { "components": [{ "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "internalType": "struct ALE.Permit", "name": "_permit", "type": "tuple" }, { "internalType": "bytes", "name": "_helperData", "type": "bytes" }, { "components": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "uint256", "name": "dola", "type": "uint256" }], "internalType": "struct ALE.DBRHelper", "name": "_dbrData", "type": "tuple" }], "name": "deleveragePosition", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_initialDeposit", "type": "uint256" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }, { "internalType": "address", "name": "_market", "type": "address" }, { "internalType": "address", "name": "_spender", "type": "address" }, { "internalType": "bytes", "name": "_swapCallData", "type": "bytes" }, { "components": [{ "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "internalType": "struct ALE.Permit", "name": "_permit", "type": "tuple" }, { "internalType": "bytes", "name": "_helperData", "type": "bytes" }, { "components": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "uint256", "name": "dola", "type": "uint256" }], "internalType": "struct ALE.DBRHelper", "name": "_dbrData", "type": "tuple" }], "name": "depositAndLeveragePosition", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "exchangeProxy", "outputs": [{ "internalType": "address payable", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_value", "type": "uint256" }, { "internalType": "address", "name": "_market", "type": "address" }, { "internalType": "address", "name": "_spender", "type": "address" }, { "internalType": "bytes", "name": "_swapCallData", "type": "bytes" }, { "components": [{ "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" }], "internalType": "struct ALE.Permit", "name": "_permit", "type": "tuple" }, { "internalType": "bytes", "name": "_helperData", "type": "bytes" }, { "components": [{ "internalType": "uint256", "name": "amountIn", "type": "uint256" }, { "internalType": "uint256", "name": "minOut", "type": "uint256" }, { "internalType": "uint256", "name": "dola", "type": "uint256" }], "internalType": "struct ALE.DBRHelper", "name": "_dbrData", "type": "tuple" }], "name": "leveragePosition", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "markets", "outputs": [{ "internalType": "contract IERC20", "name": "buySellToken", "type": "address" }, { "internalType": "contract IERC20", "name": "collateral", "type": "address" }, { "internalType": "contract ITransformHelper", "name": "helper", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_exchangeProxy", "type": "address" }], "name": "setExchangeProxy", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_market", "type": "address" }, { "internalType": "address", "name": "_buySellToken", "type": "address" }, { "internalType": "address", "name": "_collateral", "type": "address" }, { "internalType": "address", "name": "_helper", "type": "address" }], "name": "setMarket", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_market", "type": "address" }, { "internalType": "address", "name": "_helper", "type": "address" }], "name": "updateMarketHelper", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }];

export const DWF_PURCHASER_ABI = [{ "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "usdcAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "invAmount", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "purchaser", "type": "address" }], "name": "Buy", "type": "event" }, { "inputs": [], "name": "INV", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "USDC", "outputs": [{ "internalType": "contract IERC20", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "buyer", "type": "address" }, { "internalType": "bool", "name": "allowed", "type": "bool" }], "name": "allowWhitelist", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "uint256", "name": "maxInvPrice", "type": "uint256" }], "name": "buy", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "dailyBuy", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "dailyLimit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "discountBps", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "additionalTime", "type": "uint256" }], "name": "extendBuyPeriod", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getInvPrice", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "gov", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_startTime", "type": "uint256" }, { "internalType": "uint256", "name": "_runTime", "type": "uint256" }, { "internalType": "uint256", "name": "_dailyLimit", "type": "uint256" }, { "internalType": "uint256", "name": "_lifetimeLimit", "type": "uint256" }, { "internalType": "uint256", "name": "_discountBps", "type": "uint256" }, { "internalType": "uint256", "name": "_minInvPrice", "type": "uint256" }, { "internalType": "address", "name": "upgradeFrom", "type": "address" }], "name": "init", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "lastBuy", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "lastReset", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "lifetimeBuy", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "lifetimeLimit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "limitAvailable", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "minInvPrice", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "minPriceGuardian", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "poolId", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "runTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "newMinPrice", "type": "uint256" }], "name": "setMinInvPrice", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newGuardian", "type": "address" }], "name": "setMinPriceGuardian", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "startTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token", "type": "address" }], "name": "sweep", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "vault", "outputs": [{ "internalType": "contract IVault", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "whitelist", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }];
export const ST_CVX_CRV_ABI = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_user", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_account", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "indexed": false, "internalType": "bool", "name": "_isCrv", "type": "bool" }], "name": "Deposited", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "_rewardToken", "type": "address" }], "name": "HookSet", "type": "event" }, { "anonymous": false, "inputs": [], "name": "IsShutdown", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "_rewardToken", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_rewardGroup", "type": "uint256" }], "name": "RewardGroupSet", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "_rewardToken", "type": "address" }], "name": "RewardInvalidated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_user", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_token", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "_receiver", "type": "address" }], "name": "RewardPaid", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_user", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "Withdrawn", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "_token", "type": "address" }, { "internalType": "uint256", "name": "_rewardGroup", "type": "uint256" }], "name": "addTokenReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "crv", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "crvDepositor", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "cvx", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "cvxCrv", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "cvxCrvStaking", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "address", "name": "_to", "type": "address" }], "name": "deposit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint256", "name": "_weight", "type": "uint256" }], "name": "depositAndSetWeight", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "earned", "outputs": [{ "components": [{ "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "internalType": "struct CvxCrvStakingWrapper.EarnedData[]", "name": "claimable", "type": "tuple[]" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }, { "internalType": "address", "name": "_forwardTo", "type": "address" }], "name": "getReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "getReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_token", "type": "address" }], "name": "invalidateReward", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "isShutdown", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "reclaim", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "registeredRewards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "rewardHook", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "rewardLength", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_rewardGroup", "type": "uint256" }], "name": "rewardSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "rewards", "outputs": [{ "internalType": "address", "name": "reward_token", "type": "address" }, { "internalType": "uint8", "name": "reward_group", "type": "uint8" }, { "internalType": "uint128", "name": "reward_integral", "type": "uint128" }, { "internalType": "uint128", "name": "reward_remaining", "type": "uint128" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "setApprovals", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_hook", "type": "address" }], "name": "setHook", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_token", "type": "address" }, { "internalType": "uint256", "name": "_rewardGroup", "type": "uint256" }], "name": "setRewardGroup", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_weight", "type": "uint256" }], "name": "setRewardWeight", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "shutdown", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "address", "name": "_to", "type": "address" }], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }, { "internalType": "uint256", "name": "_weight", "type": "uint256" }], "name": "stakeAndSetWeight", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "stakeFor", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "supplyWeight", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "threeCrv", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "treasury", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_address", "type": "address" }, { "internalType": "uint256", "name": "_rewardGroup", "type": "uint256" }], "name": "userRewardBalance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "userRewardWeight", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }], "name": "user_checkpoint", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];

const claimAndSellStruct = `tuple(address toDbr, address toDola, address toInv, uint minOutDola, uint sellForDola, uint minOutInv, uint sellForInv)`;
const dbrRepayStruct = `tuple(address market, address to, uint percentage)`;

export const DBR_REWARDS_HELPER_ABI = [
  // "function claimAndSellDbr(uint minOut, address receiver) public",
  // "function claimSellAndRepay(uint minOut, address market, address to) external",
  // "function claimSellAndDepositInv(uint minOut, address to) external",
  `function claimAndSell(${claimAndSellStruct}, ${dbrRepayStruct}) external returns (uint dolaAmount, uint invAmount, uint repaidAmount, uint dbrAmount)`,
]

export const DBR_AUCTION_ABI = [
  "function dolaReserve() public view returns (uint256)",
  "function dbrReserve() public view returns (uint256)",
  "function dbrRatePerYear() public view returns (uint256)",
  "function maxDbrRatePerYear() public view returns (uint256)",
  "function lastUpdate() public view returns (uint256)",
  "function getCurrentReserves() public view returns (uint256 _dolaReserve, uint256 _dbrReserve)",
  "function setMaxDbrRatePerYear(uint _maxRate) external",
  "function setDbrRatePerYear(uint _rate) external",
  "function setDbrReserve(uint _dbrReserve) external",
  "function setDolaReserve(uint _dolaReserve) external",
  "function buyDBR(uint exactDolaIn, uint exactDbrOut, address to) external",
  "event Buy(address indexed caller, address indexed to, uint dolaIn, uint dbrOut)",
  "event RateUpdate(uint newRate)",
];
export const DBR_AUCTION_HELPER_ABI = [
  "function getDbrOut(uint _dolaIn) public view returns (uint _dbrOut)",
  "function getDolaIn(uint dbrOut) public view returns (uint dolaIn)",
  "function swapExactDolaForDbr(uint dolaIn, uint dbrOutMin) external returns (uint dbrOut)",
  "function swapDolaForExactDbr(uint dbrOut, uint dolaInMax) external returns (uint dolaIn)",
];

export const DOLA_SAVINGS_ABI = [
  'function setMaxYearlyRewardBudget(uint _max) public',
  'function setMaxRewardPerDolaMantissa(uint _max) public',
  'function setYearlyRewardBudget(uint _yearlyRewardBudget) public',
  'function totalSupply() public view returns (uint)',
  'function operator() public view returns (address)',
  'function maxRewardPerDolaMantissa() public view returns (uint)',
  'function maxYearlyRewardBudget() public view returns (uint)',
  'function yearlyRewardBudget() public view returns (uint)',
  'function claimable(address user) public view returns(uint)',
  'function stake(uint amount, address recipient) public',
  'function unstake(uint amount) public',
  'function claim(address to) external',
  "function balanceOf(address) external view returns (uint)",
  "event Stake(address indexed caller, address indexed recipient, uint amount)",
  "event Unstake(address indexed caller, uint amount)",
  "event Claim(address indexed caller, address indexed recipient, uint amount)",
];
// ERC4626, 
const SVAULT_ABI = [
  "function buyDBR(uint, uint) public",
  "function deposit(uint assets, address receiver) public",
  "function withdraw(uint assets, address receiver, address owner) public",
  "function redeem(uint assets, address receiver, address owner) public",
  "function totalAssets() public view returns (uint)",
  "function totalSupply() public view returns (uint)",  
  "function getDbrReserve() public view returns (uint)",
  "function weeklyRevenue(uint) public view returns (uint)",
  "function balanceOf(address) public view returns (uint)",
  "event Buy(address indexed caller, address indexed to, uint dolaIn, uint dbrOut)",
  "event Deposit(address indexed caller, address indexed owner, uint assets, uint shares)",
  "event Withdraw(address indexed caller, address indexed receiver, address indexed owner, uint assets, uint shares)",
]
export const SDOLA_ABI = [
  ...SVAULT_ABI,
  "function getDolaReserve() public view returns (uint)",
];
export const SINV_ABI = [
  ...SVAULT_ABI,
  "function getInvReserve() public view returns (uint)",
]
export const SDOLA_HELPER_ABI = [
  "function getDbrOut(uint _dolaIn) public view returns (uint _dbrOut)",
  "function getDolaIn(uint dbrOut) public view returns (uint dolaIn)",
  "function swapExactDolaForDbr(uint dolaIn, uint dbrOutMin) external returns (uint dbrOut)",
  "function swapDolaForExactDbr(uint dbrOut, uint dolaInMax) external returns (uint dolaIn)",
];
export const SINV_HELPER_ABI = [
  "function getDbrOut(uint _invIn) public view returns (uint _dbrOut)",
  "function getInvIn(uint dbrOut) public view returns (uint invIn)",
  "function swapExactInvForDbr(uint invIn, uint dbrOutMin) external returns (uint dbrOut)",
  "function swapInvForExactDbr(uint dbrOut, uint invInMax) external returns (uint invIn)",
];

export const VE_NFT_ABI = [
  "function tokensOfOwner(address) view returns (uint256[])",
  "function ownerToNFTokenIdList(address, uint256) view returns (uint256)",
  "function tokenOfOwnerByIndex(address _owner, uint256 _tokenIndex) view returns (uint256)",
  "function locked(uint256 _tokenId) view returns (tuple(int128 amount, uint256 end))",
  "function balanceOfNFT(uint) public view returns (uint)",
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
    SWAP_ROUTER,
    STABILIZER,
    DEBT_REPAYER,
    DEBT_CONVERTER,
    DBR,
    DBR_AIRDROP,
    F2_HELPER,
    F2_ORACLE,
    F2_CONTROLLER,
    F2_MARKETS,
    DBR_DISTRIBUTOR,
    F2_ALE,
    F2_DBR_REWARDS_HELPER,
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
        [ORACLE, ORACLE_ABI],
        [DOLA3POOLCRV, DOLA3POOLCRV_ABI],
        [TREASURY, TREASURY_ABI],
        [DOLA_PAYROLL, DOLA_PAYROLL_ABI],
        [XINV_VESTOR_FACTORY, VESTER_FACTORY_ABI],
        [SWAP_ROUTER, SWAP_ROUTER_ABI],
        [STABILIZER, STABILIZER_ABI],
        [DEBT_REPAYER, DEBT_REPAYER_ABI],
        [DEBT_CONVERTER, DEBT_CONVERTER_ABI],
        [DBR, DBR_ABI],
        [DBR_AIRDROP, MERKLE_DROP_ABI],
        [F2_ORACLE, F2_ORACLE_ABI],
        [F2_CONTROLLER, F2_CONTROLLER_ABI],
        [DWF_PURCHASER, DWF_PURCHASER_ABI],
        [DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI],
        ...F2_MARKETS?.map((m) => [m.address, F2_MARKET_ABI]),
        [BOND_V2_FIXED_TERM, BOND_V2_ABI],
        [BOND_V2_FIXED_TERM_TELLER, BOND_V2_FIXED_TELLER_ABI],
        [BOND_V2_AGGREGATOR, BOND_V2_AGGREGATOR_ABI],
        ['0x4621b7A9c75199271F773Ebd9A499dbd165c3191', ERC20_ABI],
        [F2_HELPER, F2_HELPER_ABI],
        [F2_ALE, F2_ALE_ABI],
        [F2_DBR_REWARDS_HELPER, DBR_REWARDS_HELPER_ABI],
        [DBR_AUCTION_ADDRESS, DBR_AUCTION_ABI],
        [DBR_AUCTION_HELPER_ADDRESS, DBR_AUCTION_HELPER_ABI],
        [DOLA_SAVINGS_ADDRESS, DOLA_SAVINGS_ABI],
        [SDOLA_HELPER_ADDRESS, SDOLA_HELPER_ABI],    
        [SINV_HELPER_ADDRESS, SINV_HELPER_ABI],
        [SINV_ADDRESS, SINV_ABI],
        [SINV_ESCROW_ADDRESS, F2_ESCROW_ABI],
        ...FEDS.map((fed) => [fed.address, fed.abi]),
        ...MULTISIGS.map((m) => [m.address, MULTISIG_ABI]),
        ...Object.values(BONDS).map((bond) => [bond.bondContract, BONDS_ABIS[bond.abiType]]),
      ],
      Object.keys(TOKENS).map((address) => [address,
        address === SDOLA_ADDRESS ?
          SDOLA_ABI :
          address === DBR ?
            DBR_ABI :
            address === INV ?
              INV_ABI :
              address === DOLA ?
                DOLA_ABI :
                ERC20_ABI
      ])
    )
  )
}