import "source-map-support";

import { Contract } from "ethers";
import { GOVERNANCE_ABI, INV_ABI } from "@app/config/abis";
import { formatUnits } from "ethers/lib/utils";
import { getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getRedisClient } from '@app/util/redis';
import { Delegate } from '@app/types';

const client = getRedisClient();

function onlyUniqueArrayFilter(value, index, self) {
  return self.indexOf(value) === index;
}

export default async function handler(req, res) {
  // authenticate cron job
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) res.status(401).json({ success: false });
  else {
    // run delegates cron job
    try {
      const chainId = process.env.NEXT_PUBLIC_CHAIN_ID!;
      const { XINV, INV, GOVERNANCE, GOVERNANCE_ALPHA: GOV_ALPHA } = getNetworkConfigConstants(chainId);
      
      // use specific AlchemyApiKey for the cron
      const provider = getProvider(chainId, process.env.ALCHEMY_CRON, true);
      
      const inv = new Contract(INV, INV_ABI, provider);

      const xinv = new Contract(XINV, INV_ABI, provider);
      const governance = new Contract(GOVERNANCE, GOVERNANCE_ABI, provider);

      const governanceAlpha = new Contract(GOV_ALPHA, GOVERNANCE_ABI, provider);
      const blockNumber = await provider.getBlockNumber();

      // fetch chain data
      const [
        delegateChanged,
        // xinvDelegateChanged,
        // gov mills
        votesCast,
        // gov Alpha (old)
        votesCastAlpha,
      ] = await Promise.all([
        inv.queryFilter(inv.filters.DelegateChanged()),
        // xinv.queryFilter(xinv.filters.DelegateChanged()),
        // gov mills
        governance.queryFilter(governance.filters.VoteCast()),
        // gov Alpha (old)
        governanceAlpha.queryFilter(governanceAlpha.filters.VoteCast()),
      ]);

      // Split in two calls, to avoid log size issue, TODO: more scalable
      const blockThreshold = 14048714;

      const [
        delegateVotesChangedOld,
        xinvDelegateVotesChangedOld,
        delegateVotesChangedLatest,
        xinvDelegateVotesChangedLatest,
      ] = await Promise.all([
        inv.queryFilter(inv.filters.DelegateVotesChanged(), 0x0, blockThreshold),
        xinv.queryFilter(xinv.filters.DelegateVotesChanged(), 0x0, blockThreshold),
        inv.queryFilter(inv.filters.DelegateVotesChanged(), blockThreshold + 1),
        xinv.queryFilter(xinv.filters.DelegateVotesChanged(), blockThreshold + 1),
      ]);

      const delegateVotesChanged = delegateVotesChangedOld.concat(delegateVotesChangedLatest);
      const xinvDelegateVotesChanged = xinvDelegateVotesChangedOld.concat(xinvDelegateVotesChangedLatest);

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

      const totalVotesCast = votesCast.concat(votesCastAlpha);

      delegateChanged.sort((a, b) => b.blockNumber - a.blockNumber);

      Object.keys(delegates).forEach((delegate: string) => {
        const uniqueDelegators = [...new Set(
          delegateChanged.filter((item, index, self) => {
            return item.args.toDelegate === delegate && self.findIndex(s => s.args.delegator === item.args.delegator) === index;
          }).map(item => item.args.delegator)
        )];

        const votes = totalVotesCast.filter(({ args }) => args.voter === delegate);

        delegates[delegate] = {
          ...delegates[delegate],
          delegators: uniqueDelegators,
          votes: votes.map(({ args, blockNumber }) => ({
            proposalId: args.proposalId.toNumber(),
            support: args.support,
            votes: parseFloat(formatUnits(args.votes)),
            bn: blockNumber,
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
      res.status(500).json({ success: false });
      console.error(err);
    }
  }
};