import { START_BLOCK } from '@inverse/config'
import { Delegate } from '@inverse/types'
import { getINVContract, getNewMulticallProvider, getNewProvider } from '@inverse/util/contracts'
import { formatUnits } from 'ethers/lib/utils'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const invContract = getINVContract(provider)

  const [delegateVotesChangedEvents, delegateChangedEvents] = await Promise.all([
    invContract.queryFilter(invContract.filters.DelegateVotesChanged(), START_BLOCK),
    invContract.queryFilter(invContract.filters.DelegateChanged(), START_BLOCK),
  ])

  const delegates = delegateVotesChangedEvents.reduce((delegates: { [key: string]: Delegate }, { args }) => {
    if (args) {
      delegates[args.delegate] = {
        address: args.delegate,
        balance: parseFloat(formatUnits(args.newBalance)),
        delegators: [],
        votes: [],
      }
    }
    return delegates
  }, {})

  delegateChangedEvents.forEach(({ args }) => {
    if (!args) {
      return
    }

    if (delegates[args.fromDelegate]) {
      delegates[args.fromDelegate].delegators.filter((address: string) => address !== args.delegator)
    }
    if (
      delegates[args.toDelegate] &&
      !delegates[args.toDelegate].delegators.find((address: string) => address === args.delegator)
    ) {
      delegates[args.toDelegate].delegators.push(args.delegator)
    }
  })

  res.status(200).json({
    delegates: Object.values(delegates)
      .filter(({ balance }) => balance > 0)
      .sort((a, b) => b.balance - a.balance),
  })
}
