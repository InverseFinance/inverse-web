import { DOLA3CRV, SECONDS_PER_DAY } from '@inverse/config'
import { getNewMulticallProvider, getNewProvider, getStakingContract } from '@inverse/util/contracts'
import { BigNumber } from 'ethers'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import type { NextApiRequest, NextApiResponse } from 'next'
import { DAYS_PER_YEAR } from '@inverse/config'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const stakingContract = getStakingContract(DOLA3CRV, provider)

  const rewardRate: BigNumber = await stakingContract.rewardRate()
  const totalSupply: BigNumber = await stakingContract.totalSupply()

  res.status(200).json({
    rates: {
      [DOLA3CRV]: totalSupply.gt(0)
        ? (parseFloat(formatEther(rewardRate.mul(SECONDS_PER_DAY * DAYS_PER_YEAR))) /
            parseFloat(formatUnits(totalSupply))) *
          100
        : 0,
    },
  })
}
