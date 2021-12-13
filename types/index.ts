import { BackgroundProps } from '@inverse/node_modules/@chakra-ui/react/dist/types'
import { UseToastOptions, ComponentWithAs, InputProps, BoxProps } from '@chakra-ui/react';
import { FunctionFragment } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

export interface Token {
  address: string
  name: string
  symbol: string
  image: string
  decimals: number
  coingeckoId?: string
}

export interface TokenWithBalance extends Token {
  balance: number;
  usdBalance: number;
}

export interface TokenList { [key: string]: Token };

export type Market = {
  token: string
  underlying: Token
  supplyApy: number
  borrowApy: number
  rewardApy: number
  liquidity: number
  collateralFactor: number
  reserveFactor: number
  totalBorrows: number
  totalReserves: number
  supplied: number
  borrowable: boolean
  mintable: boolean
  priceUsd: number
  priceXinv: number
  balance?: number
  isCollateral?: boolean
  liquidityUsd?: number
  monthlyInvRewards?: number
  monthlyAssetRewards?: number
  monthlyBorrowFee?: number
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
}

export enum ProposalStatus {
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
}

export type ProposalVote = {
  id: number
  voter: string
  support: boolean
  votes: number
}

export type Delegate = {
  rank: number
  address: string
  ensName: string
  votingPower: number
  delegators: Delegator[]
  votes: ProposalVote[]
}

export type Delegator = string

export type SWR = {
  isLoading?: boolean
  isError?: any
}

export enum NetworkIds {
  mainnet = '1',
  rinkeby = '4',
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
  escrow_v1: string,
  escrow: string,
  harvester: string,
  // current
  governance: string,
  // old
  governanceAlpha: string,
  multiDelegator: string,
  vaults: {
    vaultUsdcEth: string,
    vaultDaiWbtc: string,
    vaultDaiYfi: string,
    vaultDaiEth: string,
  };
  anchor: {
    lens: string,
    comptroller: string,
    oracle: string,
    stabilizer: string,
    treasury: string,
    markets: {
      dola: string,
      eth: string,
      wbtc: string,
      xsushi: string,
      yfi: string,
      steth: string,
      dola3poolcrv: string,
      invdolaslp: string,
      floki: string,
    };
  }
  namedAddresses: KeyString;
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

export type Vaults = { [key: string]: { from: Token; to: Token } }
export type VaultTree = { [key: string]: { [key: string]: string } }

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
}

export type ProposalFormActionFields = {
  actionId: number,
  contractAddress: string,
  func: string,
  args: any[],
  value: string,
  fragment?: FunctionFragment,
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
  onItemSelect: (selectedItem?: AutocompleteItem) => any,
} & Partial<BoxProps>

export type AddressAutocompleteProps = Omit<AutocompleteProps, "list"> & { list?: AutocompleteItem[] }