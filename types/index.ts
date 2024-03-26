import { BackgroundProps, BadgeProps } from '@app/node_modules/@chakra-ui/react/dist/types'
import { UseToastOptions, ComponentWithAs, InputProps, BoxProps, ButtonProps } from '@chakra-ui/react';
import { FunctionFragment } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { HandleTxOptions } from '@app/util/transactions';
import { ConnectionLineType } from 'react-flow-renderer';

export interface Token {
  address: string
  name: string
  symbol: string
  image: string
  decimals: number
  coingeckoId?: string
  isWrappedChainCoin?: boolean
  isLP?: boolean
  isStable?: boolean
  isCrvLP?: boolean
  isNestedCrvLp?: boolean
  nestedLpAddress?: string
  isVeloLP?: boolean
  isUniV3?: boolean
  isFusionLP?: boolean
  link?: string
  lpBalanceContract?: string
  // crv pool where lp token != pool contract
  poolAddress?: string
  lpPrice?: number
  balancerInfos?: {
    poolId: string
    vault: string
  }
  rootCrvPool?: string
  isYearnV2LP?: boolean
  convexInfos?: {
    account?: string
    fromPrice: string
    priceField?: string
  }
  pairs?: string[]
  badge?: {
    text: string
    color: BackgroundProps["bgColor"]
  }
  isInPausedSection?: boolean,
  isComposableMetapool?: boolean,
  protocolImage?: string,
  order?: number
  veNftId?: string
  isLockedVeNft?: boolean
  twgAddress?: string
  deduce?: string[]
  defillamaPoolId?: string
}

export interface TokenWithBalance extends Token {
  balance: number;
  usdBalance: number;
  usdPrice: number;
}

export interface TokenList { [key: string]: Token };

export type Market = {
  token: string
  underlying: Token
  supplyApy: number
  borrowApy: number
  supplyApr: number
  borrowApr: number
  rewardApr: number
  liquidity: number
  collateralFactor: number
  reserveFactor: number
  totalBorrows: number
  totalReserves: number
  supplied: number
  borrowable: boolean
  collateralGuardianPaused: boolean
  mintable: boolean
  priceUsd: number
  oraclePrice: number
  oracleFeed: string
  priceXinv: number
  balance?: number
  isCollateral?: boolean
  liquidityUsd?: number
  monthlyInvRewards?: number
  monthlyAssetRewards?: number
  monthlyBorrowFee?: number
  escrowDuration?: number
  utilizationRate?: number
  rewardPerBlock?: number
  claimableAmount?: number
  claimableTime?: number
  rewardsPerMonth: number
  interestRateModel?: string
  repayAllAddress?: string
}

export enum GovEra {
  alpha = 'alpha',
  mills = 'mills',
}

export type Proposal = {
  id: number // id in era
  proposalNum: number // num regardless of era
  title: string
  description: string
  descriptionAsText: string
  proposer: string
  etaTimestamp: number
  startTimestamp: number
  endTimestamp: number
  startBlock: number
  endBlock: number
  forVotes: number
  againstVotes: number
  canceled: boolean
  executed: boolean
  status: ProposalStatus
  functions: ProposalFunction[]
  voters: ProposalVote[]
  era: GovEra
  createdAt?: number
  updatedAt?: number
  executionTimestamp?: number
}

export enum ProposalStatus {
  draft = 'Draft',
  pending = 'Pending',
  active = 'Active',
  canceled = 'Canceled',
  defeated = 'Defeated',
  succeeded = 'Succeeded',
  queued = 'Queued',
  expired = 'Expired',
  executed = 'Executed',
}

export type ProposalFunction = {
  target: string
  signature: string
  callData: string
  value?: string
}

export type ProposalVote = {
  id: number
  voter: string
  support: boolean
  votes: number
}

export type EnsProfile = {
  avatar?: string
  description?: string
  twitter?: string
  discord?: string
  github?: string
  telegram?: string
}

export type Delegate = {
  rank: number
  address: string
  ensName: string
  votingPower: number
  delegators: Delegator[]
  votes: ProposalVote[]
  ensProfile?: EnsProfile
}

export type Delegator = string

export type SWR = {
  isLoading?: boolean
  isError?: any
}

export enum NetworkIds {
  mainnet = '1',
  rinkeby = '4',
  ftm = '250',
  optimism = '10',
  bsc = '56',
  arbitrum = '42161',
  polygon = '137',
  avalanche = '43114',
  base = '8453',
  // xchain
  ethftm = '1-250',
  ethop = '1-10',
}

export type KeyString = { [key: string]: string };

export type NetworkConfig = {
  chainId: string;
  INV: string,
  DOLA: string,
  DAI: string,
  USDC: string,
  USDT: string,
  WETH: string,
  YFI: string,
  XSUSHI: string,
  WBTC: string,
  XINV_V1: string,
  XINV: string,
  STETH: string,
  INVDOLASLP: string,
  DOLA3POOLCRV: string,
  THREECRV: string,
  FLOKI: string,
  DOLA_PAYROLL: string,
  DEPLOYER: string,
  escrow_old: string,
  escrow: string,
  harvester: string,
  // current
  governance: string,
  // old
  governanceAlpha: string,
  multiDelegator: string,
  stabilizer: string,
  anchor: {
    lens: string,
    comptroller: string,
    oracle: string,
    treasury: string,
  }
  F2_MARKETS: F2Market[]
  [key: string]: string | any;
}

export type Network = {
  id: string;
  codename: string;
  name: string;
  isTestnet?: boolean;
  isSupported?: boolean;
  coinSymbol: string,
  bgColor?: BackgroundProps["bgColor"],
  image?: string,
  config?: NetworkConfig;
  scan?: string;
}

export type StringNumMap = { [key: string]: number };

export type AssetDropDownProps = {
  tokens: TokenList,
  isOpen: boolean,
  onClose: () => void,
  onOpen: () => void,
  asset: Token,
  options: [string, string][],
  handleChange: (to: string) => void,
}

export interface CustomToastOptions extends Omit<UseToastOptions, "status"> {
  status: UseToastOptions["status"] | 'loading',
}

export enum AnchorOperations {
  supply = 'Supply',
  withdraw = 'Withdraw',
  borrow = 'Borrow',
  repay = 'Repay',
  migrate = 'Migrate',
}

export type ProposalFormActionFields = {
  actionId: number,
  contractAddress: string,
  func: string,
  args: any[],
  value: string,
  fragment?: FunctionFragment,
  collapsed?: boolean,
}

export type TemplateProposalFormActionFields = Omit<ProposalFormActionFields, "actionId">

export type ProposalFormFields = {
  title: string,
  description: string,
  actions: ProposalFormActionFields[],
}

export type Interests = {
  supplyUsdInterests: number,
  invUsdInterests: number,
  borrowInterests: number,
  total: number,
  totalPositive: number,
}

export type BigNumberList = { [key: string]: BigNumber };

export type RadioCardGroupOptions = { value: string, label?: React.ReactNode }[];

export enum Swappers {
  crv = 'crv',
  crvFrax = 'crvFrax',
  crvRouter = 'crvRouter',
  oneinch = '1inch',
  stabilizer = 'stabilizer',
}
export interface AutocompleteItem {
  label: string;
  value: string;
  isSearchValue?: boolean;
}

export type AutocompleteProps = {
  title?: string,
  list: AutocompleteItem[],
  defaultValue?: string,
  placeholder?: string,
  InputComp?: ComponentWithAs<"input", InputProps>,
  inputProps?: InputProps,
  isOpenDefault?: boolean,
  autoSort?: boolean,
  hideClear?: boolean,
  highlightBeforeChar?: string,
  limit?: number,
  showChevron?: boolean,
  allowUnlisted?: boolean,
  onItemSelect: (selectedItem?: AutocompleteItem) => any,
  itemRenderer?: (value: string, label: string, filteredIndex: number, search: string, filteredList: AutocompleteItem[]) => JSX.Element;
} & Partial<BoxProps>

export type AddressAutocompleteProps = Omit<AutocompleteProps, "list"> & { list?: AutocompleteItem[] }

export enum ProposalTemplates {
  invTransfer = 'invTransfer',
  invApprove = 'invApprove',
  dolaTransfer = 'dolaTransfer',
  dolaApprove = 'dolaApprove',
  daiTransfer = 'daiTransfer',
  daiApprove = 'daiApprove',
  payrollAdd = 'payrollAdd',
  payrollRemove = 'payrollRemove',
  vestorAdd = 'vestorAdd',
  // anchor
  anchorLending = 'anchorLending',
  anchorBorrowing = 'anchorBorrowing',
  anchorCollateral = 'anchorCollateral',
  anchorCollateralFactor = 'anchorCollateralFactor',
  anchorSupportMarket = 'anchorSupportMarket',
  anchorsetCompSpeed = 'anchorsetCompSpeed',
  anchorOracleFeed = 'anchorOracleFeed',
}

export type SmartButtonProps = ButtonProps & Partial<HandleTxOptions> & { refreshOnSuccess?: boolean, themeColor?: string, needPoaFirst?: boolean }

export type DraftProposal = {
  draftId: number
  title: string
  description: string
  functions: ProposalFunction[]
  createdAt: number
  updatedAt: number
}

export type PublicDraftProposal = Omit<DraftProposal, "draftId"> & {
  publicDraftId: number
  createdBy: string
  updatedBy: string
}

export type FlowChartData = {
  id: string
  label: React.ReactNode
  targets?: {
    label: React.ReactNode,
    id: string,
    linkLabel?: string,
    x?: number,
    y?: number,
    deltaX?: number
    deltaY?: number
    style?: Object
    labelContainerStyle?: Object
    sourcePosition?: 'left' | 'right' | 'bottom' | 'top'
    targetPosition?: 'left' | 'right' | 'bottom' | 'top'
    type: ConnectionLineType,
  }[]
  x?: number
  y?: number
  deltaX?: number
  deltaY?: number
  style?: Object
  labelContainerStyle?: Object
  sourcePosition?: 'left' | 'right' | 'bottom' | 'top'
  targetPosition?: 'left' | 'right' | 'bottom' | 'top'
}

export type FlowChartElementsOptions = {
  width?: number,
  height?: number,
  originX?: number,
  originY?: number,
  xGap?: number,
  yGap?: number,
}

export type FlowChartOptions = {
  showControls?: boolean
  showBackground?: boolean
  autofit?: boolean
  elementsOptions?: FlowChartElementsOptions
  defaultZoom?: number
}

export type Prices = {
  prices: {
    [key: string]: {
      usd: number
    }
  }
}

export enum FedTypes {
  LP = 'AMM',
  CROSS = 'Cross-Lending',
  ISOLATED = 'Isolated-Lending',
}

export type Fed = {
  address: string,
  abi: string[],
  chainId: NetworkIds,
  name: string,
  type: FedTypes,
  projectImage: string,
  isXchain?: boolean,
  hasEnded?: boolean,
  supplyFuncName?: string
  oldAddresses?: string[]
  incomeChainId?: string
  incomeSrcAd?: string
  oldIncomeSrcAds?: string[]
  incomeTargetAd?: string
  fusePool?: string
  isFirm?: boolean
}

export type FedWithData = Fed & {
  supply: number,
  chair: string,
  gov: string,
}

export type FedEvent = {
  blockNumber: number
  fedIndex: number
  event: "Expansion" | "Contraction"
  isContraction: boolean
  newSupply: number
  newTotalSupply: number
  timestamp: number
  transactionHash: string
  value: number
}

export type StabilizerEvent = {
  blockNumber: number
  event: "Buy" | "Sell"
  isBuy: boolean
  newTotal: number
  timestamp: number
  profit: number
  amount: number
  transactionHash?: string
}

export type FedHistory = Fed & { events: FedEvent[] };

export type AccountPosition = {
  account: string
  usdBorrowable: number
  usdBorrowed: number
  usdSupplied: number
  usdShortfall: number
  assetsIn: number[]
  borrowed: { balance: number, marketIndex: number, usdWorth: number }[]
  supplied: { balance: number, marketIndex: number, usdWorth: number }[]
}

export type AccountPositionAssets = {
  balance: number, marketIndex: number, ctoken: string, underlying: Token, usdPrice: number, usdWorth: number, collateralFactor: number
}

export type AccountPositionDetailed = AccountPosition & {
  borrowed: AccountPositionAssets[]
  supplied: AccountPositionAssets[]
  borrowingPower: AccountPositionAssets[]
  borrowLimitPercent: number
  usdBorrowingPower: number
}

export type AccountPositions = {
  lastUpdate: number
  nbPositions: number
  positions: AccountPosition[]
  markets: string[]
  prices: number[]
  collateralFactors: number[]
}

export type AccountPositionsDetailed = {
  nbPositions: number
  positions: AccountPositionDetailed[]
  markets: string[]
}

export type Bond = {
  input: string,
  ctoken: string,
  underlying: Token,
  bondContract: string,
  howToGetLink: string,
  usdPrice: number,
  inputUsdPrice: number,
  positiveRoi: boolean,
  vestingDays: number,
  maxPayout: number,
  marketPrice: number,
  roi: number,
  userInfos: {
    payout: number,
    vesting: number,
    lastBlock: number,
    vestingCompletionBlock: number,
    truePricePaid: number,
    percentVestedFor: number,
    pendingPayoutFor: number,
  }
}

export type BondV2 = {
  id: string;
  bondContract: string;
  output: string;
  bondPrice: number;
  inputUsdPrice: number;
  underlying: Token;
  howToGetLink: string;
  input: string;
  owner: string;
  teller: string;
  capacityInQuote: boolean;
  capacity: number;
  totalDebt: number;
  minPrice: number;
  maxPayout: number;
  sold: number;
  purchased: number;
  scale: number;
  controlVar: string;
  maxDebt: number;
  vestingDays: number;
  conclusion: number;
  isNotConcluded: boolean
  isPurchasable: boolean
}

export type BondV2WithRoi = BondV2 & {
  roi: number;
  marketPrice: number;
  positiveRoi: boolean;
}

export type UserBondV2 = {
  txHash: string
  blocknumber: number
  amount: number
  payout: number
  id: string
  marketId: number
  currentBalance: number
  active: boolean
  expiry: number
  supply: number
  underlying: Token
  purchaseDate: number
  vestingDays: number
  percentVestedFor: number
  name: string
}

export type DraftReview = {
  reviewer: string,
  timestamp: number,
  status?: 'ok' | 'ko',
  comment?: string,
}

export type Multisig = {
  address: string,
  name: string,
  shortName: string,
  chainId: NetworkIds,
  owners: string[],
  funds: { token: Token, balance: number, allowance?: number }[],
  threshold: number,
  governanceLink: string
  purpose: string
}

export type DAO = {
  dolaTotalSupply: number
  invTotalSupply: number
  dolaOperator: string
  dolaSupplies: { supply: number, chainId: NetworkIds }[]
  invSupplies: { supply: number, chainId: NetworkIds }[]
  treasury: { token: Token, balance: number }[],
  anchorReserves: { token: Token, balance: number }[],
  bonds: { balances: { token: Token, balance: number }[] },
  feds: FedWithData[],
  multisigs: Multisig[]
  pols: { totalSupply: number, ownedAmount: number }[]
}

export type GenericComponent = React.ComponentType<any>;

export type RefundableTransaction = {
  from: string,
  to: string,
  txHash: string,
  timestamp: number,
  successful: boolean,
  fees: number,
  name: string,
  chainId: NetworkIds,
  type: string,
  refunded: boolean,
  block: number,
  signedAt?: number,
  signedBy: string,
  refundTxHash?: string
}

export type Vester = {
  address: string
  recipient: string
  amount: number
}

export type Payroll = { recipient: string, amount: number, unclaimed: number }

export type LiquidationEvent = {
  id: string,
  blocktime: number,
  borrower: string,
  liquidator: string,
  repaidCtoken: string,
  seizedCtoken: string,
  underlyingRepayAmount: string,
  underlyingSeizeAmount: string,
  repaidUnderlying: Token,
}

export type LiquidationItem = LiquidationEvent & {
  txHash: string
  repaidUnderlying: Token
  seizedUnderlying: Token
}

export type YieldOppy = {
  apy: number,
  chain: string,
  tvlUsd: number,
  project: string,
  symbol: string,
  pool: string,
}

export type DebtConversion = {
  user: string
  anToken: string
  epoch: number
  dolaAmount: number
  conversionIndex: number
  underlyingAmount: number
  txHash: string
  blocknumber: number
  redeemableIOUs: number
  redeemedIOUs: number
  redeemablePerc: number
  redeemedPerc: number
  currentlyRedeemableIOUs: number
  currentlyRedeemableDOLAs: number
  leftToRedeem: number
}

export type DebtRepayment = {
  epoch: number
  dolaAmount: number
}

export type F2Market = {
  address: string
  name: string
  collateral: string
  underlying: Token
  price: number
  collateralFactor: number
  totalDebt: number
  bnDolaLiquidity: BigNumber
  dolaLiquidity: number
  replenishmentIncentive: number
  liquidationIncentive: number
  liquidationFactor: number
  dailyLimit: number
  dailyBorrows: number
  leftToBorrow: number
  bnLeftToBorrow: number
  borrowPaused: boolean
  borrowController: string
  icon?: string
  zapperAppGroup?: string
  isGovTokenCollateral?: boolean
  hasClaimableRewards?: boolean
  hasStakingLikeRewards?: boolean
  rewardTypeLabel?: string
  isInv?: boolean
  govLink?: string
  marketIcon?: string
  helper?: boolean
  oracleType: string
  oracleFeed: string
  escrowImplementation: string
  badgeInfo: string
  badgeProps?: BadgeProps
  startingBlock: number
  order?: number
  invStakedViaDistributor?: number
  supplyApy?: number
  supplyApyLow?: number
  extraApy?: number
  dbrApr?: number
  dbrRewardRate?: number
  dbrYearlyRewardRate?: number
  claimMethod?: string
  borrowingWasDisabledBeforeBlock?: number
  minDebt: number
  ceiling: number
  oracleStartingBlock?: number
  hasAleFeat?: boolean
  isPhasingOut?: boolean
  phasingOutComment?: string
  phasingOutLink?: string
  aleData: { buySellToken: string, collateral: string, helper: string }
}

export type FirmAction = {
  combinedKey: string,
  actionName: string,
  blockNumber: number,
  txHash: string,
  amount?: number,
  isCombined: boolean,
  amountCombined?: number,
  deficit?: number,
  repaidDebt?: number,
  liquidatorReward?: number,
  repayer?: string,
  to?: string,
  escrow?: string,
  replenisher?: string,
  name: string,
  nameCombined?: string,
  logIndex: number,
  isCollateralEvent: boolean,
  tokenName: string,
  tokenNameCombined?: string,
}

export type CoordinatesArray = { x: number, y: number }[]

export type LiquidityPoolAggregatedData = {
  timestamp: number
  tvl: number
  balance: number
  pairingDepth: number
  avgDolaWeight: number
  pol: number
  rewardDay: number
  avgApy: number
}

export type ZapperToken = {
  metaType: 'claimable',
  balanceUSD: number,
  price: number,
  balance: number,
  address: string,
}

export type CoingeckoHistoricalData = {
  prices: [number, number][],
  market_caps: [number, number][],
  total_volumes: [number, number][],
}

export type DbrAuctionType = 'classic' | 'sdola';

export type AccountDBRMarket = F2Market & {
  account: string | undefined | null
  escrow: string | undefined
  deposits: number
  depositsUsd: number
  bnDeposits: BigNumber
  creditLimit: number
  bnCreditLimit: BigNumber
  withdrawalLimit: number
  bnWithdrawalLimit: BigNumber
  creditLeft: number
  perc: number
  debt: number
  bnDebt: BigNumber
  bnCollateralBalance: BigNumber
  collateralBalance: number
  hasDebt: boolean
  liquidationPrice: number | null
  liquidatableDebtBn: BigNumber
  liquidatableDebt: number
  seizableWorth: number,
  seizable: number,
  underlyingExRate?: number,
}