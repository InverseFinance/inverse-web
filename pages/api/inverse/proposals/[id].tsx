import type { NextApiRequest, NextApiResponse } from 'next'
import { getGovernanceContract, getNewMulticallProvider, getNewProvider } from '@inverse/util/contracts'
import { formatUnits } from 'ethers/lib/utils'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query
  const provider = getNewMulticallProvider(getNewProvider())
  const governanceContract = getGovernanceContract(provider)

  const voteEvents = await governanceContract.queryFilter(governanceContract.filters.VoteCast())
  const votes = voteEvents.filter(({ args }: any) => args.proposalId.eq(id))

  res.status(200).json({
    voters: votes.map((vote: any) => ({
      id: vote.args[1].toNumber(),
      voter: vote.args[0],
      support: vote.args[2],
      votes: parseFloat(formatUnits(vote.args[3])),
    })),
  })
}
