import { TOKENS, UNDERLYING } from '@inverse/config'
import { getNewMulticallProvider, getNewProvider, getVaultContracts } from '@inverse/util/contracts'
import { BigNumber, Contract, utils } from 'ethers'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const vaultContracts = getVaultContracts(provider)

  const allTotalSupply = await Promise.all(vaultContracts.map((contract: Contract) => contract.totalSupply()))

  const balancesMap: { [key: string]: BigNumber } = {}
  allTotalSupply.forEach((totalSupply: BigNumber, i) => {
    const underlying = UNDERLYING[vaultContracts[i].address]
    if (underlying?.address) {
      const balance = balancesMap[underlying.address] || BigNumber.from(0)
      balancesMap[underlying.address] = balance.add(totalSupply)
    }
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
