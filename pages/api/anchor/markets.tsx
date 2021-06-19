import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getAnchorContracts,
  getComptrollerContract,
  getNewMulticallProvider,
  getNewProvider,
  getXINVContract,
} from '@inverse/util/contracts'
import { ANCHOR_ETH, INV, TOKENS, ETH_MANTISSA, BLOCKS_PER_DAY, DAYS_PER_YEAR, UNDERLYING } from '@inverse/config'
import { Market } from '@inverse/types'
import { formatUnits } from 'ethers/lib/utils'

const toApy = (rate: number) => (Math.pow((rate / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR) - 1) * 100

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const comptrollerContract = getComptrollerContract(provider)
  const anchorContracts = getAnchorContracts(provider)

  const supplyRates = await Promise.all(anchorContracts.map((contract) => contract.supplyRatePerBlock()))
  const borrowRates = await Promise.all(anchorContracts.map((contract) => contract.borrowRatePerBlock()))
  const cashes = await Promise.all(anchorContracts.map((contract) => contract.getCash()))
  const collateralFactors = await Promise.all(
    anchorContracts.map((contract) => comptrollerContract.markets(contract.address))
  )

  const supplyApys = supplyRates.map((rate) => toApy(rate))
  const borrowApys = borrowRates.map((rate) => toApy(rate))

  const markets: Market[] = anchorContracts.map(({ address }, i) => ({
    token: address,
    underlying: address !== ANCHOR_ETH ? UNDERLYING[address] : TOKENS.ETH,
    supplyApy: supplyApys[i],
    borrowApy: borrowApys[i],
    liquidity: parseFloat(formatUnits(cashes[i], UNDERLYING[address].decimals)),
    collateralFactor: parseFloat(formatUnits(collateralFactors[i][1])),
  }))

  const xINV = getXINVContract(provider)

  const [rewardPerBlock, exchangeRate, totalSupply, collateralFactor] = await Promise.all([
    xINV.rewardPerBlock(),
    xINV.exchangeRateStored(),
    xINV.totalSupply(),
    comptrollerContract.markets(xINV.address),
  ])

  markets.push({
    token: xINV.address,
    underlying: TOKENS[INV],
    supplyApy:
      (((rewardPerBlock / ETH_MANTISSA) * BLOCKS_PER_DAY * DAYS_PER_YEAR) /
        ((totalSupply / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA))) *
      100,
    collateralFactor: parseFloat(formatUnits(collateralFactor[1])),
  })

  res.status(200).json({
    markets,
  })
}
