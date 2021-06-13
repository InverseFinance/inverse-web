import { TOKENS } from '@inverse/constants'
import { baseURL, getUSDPrices } from '@inverse/util/coingecko'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const [_vaults, _anchor, _stabilizer, _prices] = await Promise.all([
    fetch(`${baseURL}/api/vaults/balances`),
    fetch(`${baseURL}/api/anchor/balances`),
    fetch(`${baseURL}/api/stabilizer/balances`),
    getUSDPrices(),
  ])

  const [vaults, anchor, stabilizer, prices] = await Promise.all([
    _vaults.json(),
    _anchor.json(),
    _stabilizer.json(),
    _prices.json(),
  ])

  const balancesMap: { [key: string]: number } = {}
  vaults.balances.forEach(({ address, balance }: { address: string; balance: number }) => {
    balancesMap[address] = (balancesMap[address] || 0) + balance
  })
  anchor.balances.forEach(({ address, balance }: { address: string; balance: number }) => {
    balancesMap[address] = (balancesMap[address] || 0) + balance
  })
  stabilizer.balances.forEach(({ address, balance }: { address: string; balance: number }) => {
    balancesMap[address] = (balancesMap[address] || 0) + balance
  })

  const balances = Object.entries(balancesMap).map(([address, balance]) => {
    const token = TOKENS[address]

    return {
      token: token.coingeckoId,
      address,
      balance: balance,
      value: balance * prices[token.coingeckoId].usd,
    }
  })

  res.status(200).json({
    tvl: balances.reduce((prev, curr) => prev + curr.value, 0),
    balances,
  })
}
