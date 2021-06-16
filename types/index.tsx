import { BigNumber } from 'ethers'

export type Token = {
  address: string
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
  liquidity?: number
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
