import { ANCHOR_ETH, BLOCKS_PER_DAY, DAYS_PER_YEAR, ETH_MANTISSA, INV, TOKENS, UNDERLYING } from '@inverse/config'
import { Market } from '@inverse/types'
import {
  getAnchorContracts,
  getComptrollerContract,
  getNewMulticallProvider,
  getNewProvider,
  getXINVContract,
} from '@inverse/util/contracts'
import { formatUnits } from 'ethers/lib/utils'
import type { NextApiRequest, NextApiResponse } from 'next'

const toApy = (rate: number) => (Math.pow((rate / ETH_MANTISSA) * BLOCKS_PER_DAY + 1, DAYS_PER_YEAR) - 1) * 100

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const comptrollerContract = getComptrollerContract(provider)
  const anchorContracts = getAnchorContracts(provider)

  const [
    supplyRates,
    borrowRates,
    cashes,
    collateralFactors,
    speeds,
    totalSupplies,
    exchangeRates,
    borrowState,
    prices,
  ] = await Promise.all([
    Promise.all(anchorContracts.map((contract) => contract.supplyRatePerBlock())),
    Promise.all(anchorContracts.map((contract) => contract.borrowRatePerBlock())),
    Promise.all(anchorContracts.map((contract) => contract.getCash())),
    Promise.all(anchorContracts.map((contract) => comptrollerContract.markets(contract.address))),
    Promise.all(anchorContracts.map((contract) => comptrollerContract.compSpeeds(contract.address))),
    Promise.all(anchorContracts.map((contract) => contract.totalSupply())),
    Promise.all(anchorContracts.map((contract) => contract.callStatic.exchangeRateCurrent())),
    Promise.all(anchorContracts.map((contract) => comptrollerContract.compBorrowState(contract.address))),
    (
      await fetch(
        `${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${Object.values(TOKENS).map(
          ({ coingeckoId }: any) => coingeckoId
        )}`
      )
    ).json(),
  ])

  const supplyApys = supplyRates.map((rate) => toApy(rate))
  const borrowApys = borrowRates.map((rate) => toApy(rate))
  const rewardApys = speeds.map((speed, i) => {
    const underlying = UNDERLYING[anchorContracts[i].address]
    return toApy(
      (speed * prices[TOKENS[INV].coingeckoId].usd) /
        (parseFloat(formatUnits(totalSupplies[i].toString(), underlying.decimals)) *
          parseFloat(formatUnits(exchangeRates[i])) *
          prices[underlying.coingeckoId].usd)
    )
  })

  const markets: Market[] = anchorContracts.map(({ address }, i) => ({
    token: address,
    underlying: address !== ANCHOR_ETH ? UNDERLYING[address] : TOKENS.ETH,
    supplyApy: supplyApys[i],
    borrowApy: borrowApys[i],
    rewardApy: rewardApys[i],
    borrowable: borrowState[i][1] > 0,
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
