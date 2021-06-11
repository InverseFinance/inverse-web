import type { NextApiRequest, NextApiResponse } from 'next'
import { getGovernanceContract, getNewMulticallProvider, getNewProvider } from '@inverse/util/contracts'
import { utils } from 'ethers'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const governanceContract = getGovernanceContract(provider)

  const count = (await governanceContract.proposalCount()).toNumber()

  const _proposals = await Promise.all([...Array(count).keys()].map((i) => governanceContract.proposals(i + 1)))
  const proposals = _proposals.map((proposal) => ({
    id: proposal[0].toNumber(),
    proposer: proposal[1],
    eta: new Date(proposal[2].toNumber() * 1000),
    startBlock: proposal[3].toNumber(),
    endBlock: proposal[4].toNumber(),
    forVotes: parseFloat(utils.formatUnits(proposal[5])),
    againstVotes: parseFloat(utils.formatUnits(proposal[6])),
    canceled: proposal[7],
    executed: proposal[8],
  }))

  res.status(200).json({
    count,
    passed: proposals.filter(({ forVotes, againstVotes }) => forVotes > againstVotes).length,
    failed: proposals.filter(({ forVotes, againstVotes }) => forVotes < againstVotes).length,
    forVotes: proposals.reduce((prev, curr) => prev + curr.forVotes, 0),
    againstVotes: proposals.reduce((prev, curr) => prev + curr.againstVotes, 0),
    proposals,
  })
}
