import type { NextApiRequest, NextApiResponse } from 'next'
import { getNewProvider, getStabilizerContract } from '@inverse/util/contracts'
import { utils } from 'ethers'
import { DAI, TOKENS } from '@inverse/config'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewProvider()
  const stabilizerContract = getStabilizerContract(provider)

  const token = TOKENS[DAI]
  const supply = await stabilizerContract.supply()

  res.status(200).json({
    balances: [
      {
        token: token.coingeckoId,
        address: DAI,
        balance: parseFloat(utils.formatUnits(supply, token.decimals)),
      },
    ],
  })
}
