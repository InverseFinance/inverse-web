import { Token, TOKENS } from '@inverse/constants'

const dev = process.env.NODE_ENV !== 'production'

export const baseURL = dev ? 'http://localhost:3000' : 'https://inverse-web.vercel.app'

const COINGECKO_PRICE_API = 'https://api.coingecko.com/api/v3/simple/price'

export const getUSDPrice = (coingeckoId: string) => {
  return fetch(`${COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoId}`)
}

export const getUSDPrices = () => {
  const coingeckoIds = Object.values(TOKENS).map(({ coingeckoId }: Token) => coingeckoId)
  return fetch(`${COINGECKO_PRICE_API}?vs_currencies=usd&ids=${coingeckoIds.join(',')}`)
}
