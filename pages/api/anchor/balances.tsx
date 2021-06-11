import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getAnchorContracts,
  getComptrollerContract,
  getNewMulticallProvider,
  getNewProvider,
} from '@inverse/util/contracts'
import { ANCHOR_DOLA, ANCHOR_ETH, TOKENS, WETH } from '@inverse/constants'
import { BigNumber, Contract, utils } from 'ethers'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const comptrollerContract = getComptrollerContract(provider)

  const allMarkets = await comptrollerContract.getAllMarkets()
  const anchorContracts = getAnchorContracts(
    allMarkets.filter((address: string) => address !== ANCHOR_DOLA),
    provider
  )

  const allCash = await Promise.all(anchorContracts.map((contract: Contract) => contract.getCash()))
  const allUnderlying = await Promise.all(
    anchorContracts.map((contract: Contract) => (contract.address !== ANCHOR_ETH ? contract.underlying() : WETH))
  )

  const balancesMap: { [key: string]: BigNumber } = {}
  allCash.forEach((cash: BigNumber, i) => {
    const underlying = allUnderlying[i]
    const balance = balancesMap[underlying] || BigNumber.from(0)
    balancesMap[underlying] = balance.add(cash)
  })

  const balances = Object.entries(balancesMap).map(([address, totalSupply]) => {
    const token = TOKENS[address]

    return {
      token: token.coingeckoId,
      address,
      balance: parseFloat(utils.formatUnits(totalSupply, token.decimals)),
    }
  })

  res.status(200).json({
    balances,
  })
}
