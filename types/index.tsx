import { BigNumber } from 'ethers'

export type Token = {
  address: string
  name: string
  symbol: string
  coingeckoId: string
  image: string
  decimals: number
}

export type Market = {
  token: string
  underlying: Token
  supplyApy?: number
  borrowApy?: number
  rewardApy?: number
  liquidity?: number
  collateralFactor?: number
  borrowable?: boolean
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
  voter: string
  support: boolean
  votes: number
}

export type Prices = {
  [key: string]: {
    [key: string]: number
  }
}

export type Balances = {
  [key: string]: BigNumber
}

export type Rates = {
  [key: string]: number
}
