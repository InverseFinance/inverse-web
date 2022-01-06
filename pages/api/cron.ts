import "source-map-support";

import { Contract } from "ethers";
import { GOVERNANCE_ABI, INV_ABI } from "@inverse/config/abis";
import { formatUnits } from "ethers/lib/utils";
import { getNetworkConfig } from '@inverse/config/networks';
import { getProvider } from '@inverse/util/providers';
import { getRedisClient } from '@inverse/util/redis';
import { Delegate } from '@inverse/types';

const client = getRedisClient();

function onlyUniqueArrayFilter(value, index, self) {
  return self.indexOf(value) === index;
}

export default async function handler(req, res) {
  // authenticate cron job
  if (req.method !== 'POST') res.status(405).json({ success: false });
  else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) res.status(401).json({ success: false });
  else {
    // run delegates cron job
    try {
      const { chainId = '1' } = req.query;
      const networkConfig = getNetworkConfig(chainId, false);
      if (!networkConfig?.governance || !networkConfig?.governanceAlpha) {
        res.status(403).json({ success: false, message: `No Cron support on ${chainId} network` });
      }
      const { XINV, INV, governance: GOVERNANCE, governanceAlpha: GOV_ALPHA } = networkConfig!;
      // use specific AlchemyApiKey for the cron
      const provider = getProvider(chainId, process.env.CRON_ALCHEMY_API, true);
      const inv = new Contract(INV, INV_ABI, provider);
      const xinv = new Contract(XINV, INV_ABI, provider);
      const governance = new Contract(GOVERNANCE, GOVERNANCE_ABI, provider);
      const governanceAlpha = new Contract(GOV_ALPHA, GOVERNANCE_ABI, provider);
      const blockNumber = await provider.getBlockNumber();

      // fetch chain data
      const [
        delegateVotesChanged,
        delegateChanged,
        xinvDelegateVotesChanged,
        xinvDelegateChanged,
        // gov mills
        votesCast,
        // gov Alpha (old)
        votesCastAlpha,
      ] = await Promise.all([
        inv.queryFilter(inv.filters.DelegateVotesChanged()),
        inv.queryFilter(inv.filters.DelegateChanged()),
        xinv.queryFilter(xinv.filters.DelegateVotesChanged()),
        xinv.queryFilter(xinv.filters.DelegateChanged()),
        // gov mills
        governance.queryFilter(governance.filters.VoteCast()),
        // gov Alpha (old)
        governanceAlpha.queryFilter(governanceAlpha.filters.VoteCast()),
      ]);

      const invDelegates: { [key: string]: Delegate } = delegateVotesChanged.reduce(
        (dels: any, { args }) => {
          if (args) {
            dels[args.delegate] = {
              address: args.delegate,
              votingPower: parseFloat(formatUnits(args.newBalance)),
              delegators: [],
              votes: [],
            };
          }
          return dels;
        },
        {}
      );

      const xinvExRate = await xinv.callStatic.exchangeRateCurrent();

      const xinvDelegates: { [key: string]: Delegate } = xinvDelegateVotesChanged.reduce(
        (dels: any, { args }) => {
          if (args) {
            dels[args.delegate] = {
              address: args.delegate,
              votingPower: parseFloat(formatUnits(args.newBalance)) * parseFloat(formatUnits(xinvExRate)),
              delegators: [],
              votes: [],
            };
          }
          return dels;
        },
        {}
      );

      const delegates: { [key: string]: Delegate } = { ...invDelegates };
      Object.entries(xinvDelegates).forEach(([address, xinvDelegate]) => {
        if (delegates[address]) {
          delegates[address].votingPower += xinvDelegate.votingPower
        } else {
          delegates[address] = xinvDelegate;
        }
      })

      const totalDelegateChanged = delegateChanged.concat(xinvDelegateChanged);
      const totalVotesCast = votesCast.concat(votesCastAlpha);

      Object.keys(delegates).forEach((delegate: string) => {
        const delegators = totalDelegateChanged
          .filter(({ args }) => args.toDelegate === delegate)
          .map(({ args }) => args.delegator)
          .filter(onlyUniqueArrayFilter)

        const undelegators = totalDelegateChanged
          .filter(({ args }) => args.fromDelegate === delegate)
          .map(({ args }) => args.delegator)
          .filter(onlyUniqueArrayFilter)

        const votes = totalVotesCast.filter(({ args }) => args.voter === delegate);

        delegates[delegate] = {
          ...delegates[delegate],
          delegators: Array.from(
            new Set(
              delegators.filter((delegator) => !undelegators.includes(delegator))
            )
          ),
          votes: votes.map(({ args }) => ({
            proposalId: args.proposalId.toNumber(),
            support: args.support,
            votes: parseFloat(formatUnits(args.votes)),
          })),
        };
      });

      await client.set(`${chainId}-delegates`, JSON.stringify({
        blockNumber,
        timestamp: Date.now(),
        data: delegates,
      }))

      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
    }
  }
};