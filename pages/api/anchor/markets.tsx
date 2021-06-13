import type { NextApiRequest, NextApiResponse } from 'next'
import { getAnchorContracts, getNewMulticallProvider, getNewProvider, getXINVContract } from '@inverse/util/contracts'
import { ANCHOR_ETH, INV, TOKENS, WETH, ETH_MANTISSA, BLOCKS_PER_DAY, DAYS_PER_YEAR } from '@inverse/constants'
import { Market } from '@inverse/types'

const toApy = (rate: number) => (Math.pow((rate / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR) - 1) * 100

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const anchorContracts = getAnchorContracts(provider)

  const underlying = await Promise.all(
    anchorContracts.map((contract) => (contract.address !== ANCHOR_ETH ? contract.underlying() : 'ETH'))
  )

  const supplyRates = await Promise.all(anchorContracts.map((contract) => contract.supplyRatePerBlock()))
  const borrowRates = await Promise.all(anchorContracts.map((contract) => contract.borrowRatePerBlock()))

  const supplyApys = supplyRates.map((rate) => toApy(rate))
  const borrowApys = borrowRates.map((rate) => toApy(rate))

  const markets: Market[] = anchorContracts.map((_, i) => ({
    ...TOKENS[underlying[i]],
    supplyApy: supplyApys[i],
    borrowApy: borrowApys[i],
  }))

  const xINV = getXINVContract(provider)

  const [rewardPerBlock, exchangeRate, totalSupply] = await Promise.all([
    xINV.rewardPerBlock(),
    xINV.exchangeRateStored(),
    xINV.totalSupply(),
  ])

  markets.push({
    ...TOKENS[INV],
    supplyApy:
      (((rewardPerBlock / ETH_MANTISSA) * BLOCKS_PER_DAY * DAYS_PER_YEAR) /
        ((totalSupply / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA))) *
      100,
  })

  res.status(200).json({
    markets,
  })
}
