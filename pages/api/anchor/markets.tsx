import type { NextApiRequest, NextApiResponse } from 'next'
import { getComptrollerContract, getNewMulticallProvider, getNewProvider } from '@inverse/util/contracts'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const comptrollerContract = getComptrollerContract(provider)

  const markets = await comptrollerContract.getAllMarkets()

  res.status(200).json({
    markets,
  })
}
