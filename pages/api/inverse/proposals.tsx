import type { NextApiRequest, NextApiResponse } from 'next'
import { getGovernanceContract, getNewMulticallProvider, getNewProvider } from '@inverse/util/contracts'
import { formatUnits } from 'ethers/lib/utils'
import { ProposalStatus } from '@inverse/types'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const governanceContract = getGovernanceContract(provider)

  const [count, quorumVotes] = await Promise.all([governanceContract.proposalCount(), governanceContract.quorumVotes()])

  const proposals = await Promise.all(
    [...Array(count.toNumber()).keys()].map((i) => governanceContract.proposals(i + 1))
  )

  const [startBlocks, endBlocks, statuses, proposalEvents, voteEvents] = await Promise.all([
    await Promise.all(proposals.map(({ startBlock }) => provider.getBlock(startBlock.toNumber()))),
    await Promise.all(proposals.map(({ endBlock }) => provider.getBlock(endBlock.toNumber()))),
    await Promise.all(proposals.map(({ id }) => governanceContract.state(id))),
    await governanceContract.queryFilter(governanceContract.filters.ProposalCreated(null)),
    await governanceContract.queryFilter(governanceContract.filters.VoteCast()),
  ])

  res.status(200).json({
    quorumVotes: parseFloat(formatUnits(quorumVotes)),
    proposals: proposals.map(
      ({ id, proposer, eta, startBlock, endBlock, forVotes, againstVotes, canceled, executed }, i) => {
        const { args }: any = proposalEvents.find(({ args }: any) => args.id.eq(id))
        const votes = voteEvents.filter(({ args }: any) => args.proposalId.eq(id))
        const status: number = statuses[i].toNumber()
        return {
          id: id.toNumber(),
          proposer: proposer,
          etaTimestamp: eta.toNumber() * 1000,
          startTimestamp: startBlocks[i].timestamp * 1000,
          endTimestamp: endBlocks[i].timestamp * 1000,
          startBlock: startBlock.toNumber(),
          endBlock: endBlock.toNumber(),
          forVotes: parseFloat(formatUnits(forVotes)),
          againstVotes: parseFloat(formatUnits(againstVotes)),
          canceled: canceled,
          executed: executed,
          title: args.description.split('\n')[0].split('# ')[1],
          description: args.description.split('\n').slice(1).join('\n'),
          status: Object.values(ProposalStatus)[status],
          functions: args.targets.map((target: any, i: number) => ({
            target,
            signature: args.signatures[i],
            callData: args.calldatas[i],
          })),
          voters: votes.map((vote: any) => ({
            voter: vote.args[0],
            support: vote.args[2],
            votes: parseFloat(formatUnits(vote.args[3])),
          })),
        }
      }
    ),
  })
}
