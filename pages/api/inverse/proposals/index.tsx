import type { NextApiRequest, NextApiResponse } from 'next'
import { getGovernanceContract, getNewMulticallProvider, getNewProvider } from '@inverse/util/contracts'
import { formatUnits } from 'ethers/lib/utils'
import { ProposalStatus } from '@inverse/types'

const GRACE_PERIOD = 1209600

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const governanceContract = getGovernanceContract(provider)

  const [blockNumber, count, quorumVotes] = await Promise.all([
    provider.getBlockNumber(),
    governanceContract.proposalCount(),
    governanceContract.quorumVotes(),
  ])

  const proposals = await Promise.all(
    [...Array(count.toNumber()).keys()].map((i) => governanceContract.proposals(i + 1))
  )

  console.log(proposals)

  const startBlockPromises: any[] = proposals.map(({ startBlock }) => provider.getBlock(startBlock.toNumber()))
  const endBlockPromises: any[] = proposals.map(({ endBlock }) => provider.getBlock(endBlock.toNumber()))

  const promises: any = [governanceContract.queryFilter(governanceContract.filters.ProposalCreated())].concat(
    startBlockPromises,
    endBlockPromises
  )

  const data = await Promise.all(promises)

  const proposalEvents: any = data[0]
  const startBlocks: any[] = data.slice(1, count.toNumber() + 1)
  const endBlocks: any[] = data.slice(1 + count.toNumber(), 2 * count.toNumber() + 1)

  res.status(200).json({
    quorumVotes: parseFloat(formatUnits(quorumVotes)),
    proposals: proposals.map(
      ({ id, proposer, eta, startBlock, endBlock, forVotes, againstVotes, canceled, executed }, i) => {
        const { args }: any = proposalEvents.find(({ args }: any) => args.id.eq(id))

        let status = ProposalStatus.queued
        if (canceled) {
          status = ProposalStatus.canceled
        } else if (executed) {
          status = ProposalStatus.executed
        } else if (blockNumber <= startBlock.toNumber()) {
          status = ProposalStatus.pending
        } else if (blockNumber <= endBlock.toNumber()) {
          status = ProposalStatus.active
        } else if (forVotes.lte(againstVotes) || forVotes.lte(quorumVotes)) {
          status = ProposalStatus.defeated
        } else if (eta.isZero()) {
          status = ProposalStatus.succeeded
        } else if (Date.now() >= eta.toNumber() + GRACE_PERIOD) {
          status = ProposalStatus.expired
        }

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
          status,
          functions: args.targets.map((target: any, i: number) => ({
            target,
            signature: args.signatures[i],
            callData: args.calldatas[i],
          })),
        }
      }
    ),
  })
}
