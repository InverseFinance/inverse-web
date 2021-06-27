import { VAULTS, VAULT_DAI_ETH, VAULT_TOKENS } from '@inverse/config'
import {
  getHarvesterContract,
  getNewMulticallProvider,
  getNewProvider,
  getVaultContract,
} from '@inverse/util/contracts'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import type { NextApiRequest, NextApiResponse } from 'next'
import { DAYS_PER_YEAR } from '@inverse/config'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const harvesterContract = getHarvesterContract(provider)

  const rates: BigNumber[] = await Promise.all(
    VAULT_TOKENS.map((address: string) => harvesterContract.ratePerToken(address))
  )

  const lastDistribution = await getVaultContract(VAULT_DAI_ETH, provider).lastDistribution()

  res.status(200).json({
    lastDistribution: lastDistribution.toNumber(),
    rates: rates.reduce((res: { [key: string]: number }, rate: BigNumber, i: number) => {
      res[VAULT_TOKENS[i]] =
        parseFloat(
          formatUnits(rate.mul(DAYS_PER_YEAR), BigNumber.from(31).sub(VAULTS[VAULT_TOKENS[i]].from.decimals))
        ) * 100
      return res
    }, {}),
  })
}
