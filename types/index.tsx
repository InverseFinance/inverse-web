export type Token = {
  address?: string
  symbol: string
  coingeckoId: string
  decimals: number
}

export type Market = Token & {
  supplyApy?: number
  borrowApy?: number
}
