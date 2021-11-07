import { BackgroundProps } from '@inverse/node_modules/@chakra-ui/react/dist/types'
import { UseToastOptions } from '@chakra-ui/react';

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
  balance?: number
  isCollateral?: boolean
  liquidityUsd?: number
  mintable: boolean
}

export type Proposal = {
  id: number
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
  escrow_v1: string,
  escrow: string,
  harvester: string,
  governance: string,
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
    };
  }
  namedAddresses: KeyString;
  [key: string]: string | any;
}

export type Network = {
  id: string;
  codename: string;
  name: string;
  isTestnet: boolean;
  isSupported: boolean;
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