import type { NextApiRequest, NextApiResponse } from 'next'
import { getINVContract, getNewMulticallProvider, getNewProvider } from '@inverse/util/contracts'
import { START_BLOCK } from '@inverse/config'
import { formatUnits } from 'ethers/lib/utils'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = getNewMulticallProvider(getNewProvider())
  const invContract = getINVContract(provider)

  const [delegateVotesChangedEvents, delegateChangedEvents] = await Promise.all([
    invContract.queryFilter(invContract.filters.DelegateVotesChanged(), START_BLOCK),
    invContract.queryFilter(invContract.filters.DelegateChanged(), START_BLOCK),
  ])

  const delegates = delegateVotesChangedEvents.reduce((delegates: any, { args }: any) => {
    delegates[args.delegate] = {
      address: args.delegate,
      balance: parseFloat(formatUnits(args.newBalance)),
      delegators: [],
    }
    return delegates
  }, {})

  delegateChangedEvents.forEach(({ args }: any) => {
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
      .filter(({ balance }: any) => balance > 0)
      .sort((a: any, b: any) => b.balance - a.balance),
  })
}
