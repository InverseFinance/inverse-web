import "source-map-support";

import { Contract, BigNumber } from "ethers";
import { GOVERNANCE_ABI, INV_ABI } from "@inverse/config/abis";
import { formatUnits } from "ethers/lib/utils";
import { getNetworkConfig } from '@inverse/config/networks';
import { getProvider } from '@inverse/util/providers';
import { getRedisClient } from '@inverse/util/redis';
import { GovEra, Delegate, ProposalStatus } from '@inverse/types';
import { GRACE_PERIOD, PROPOSAL_DURATION } from '@inverse/config/constants';

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
      const provider = getProvider(chainId, process.env.CRON_ALCHEMY_API || 'H2RwjQnt6ADjGQX-IpA5jK7pBEqTKGJn', true);
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
        proposalCount,
        quorumVotes,
        proposalsCreated,
        // gov Alpha (old)
        votesCastAlpha,
        proposalCountAlpha,
        quorumVotesAlpha,
        proposalsCreatedAlpha,
      ] = await Promise.all([
        inv.queryFilter(inv.filters.DelegateVotesChanged()),
        inv.queryFilter(inv.filters.DelegateChanged()),
        xinv.queryFilter(xinv.filters.DelegateVotesChanged()),
        xinv.queryFilter(xinv.filters.DelegateChanged()),
        // gov mills
        governance.queryFilter(governance.filters.VoteCast()),
        governance.proposalCount(),
        governance.quorumVotes(),
        governance.queryFilter(governance.filters.ProposalCreated()),
        // gov Alpha (old)
        governanceAlpha.queryFilter(governanceAlpha.filters.VoteCast()),
        governanceAlpha.proposalCount(),
        governanceAlpha.quorumVotes(),
        governanceAlpha.queryFilter(governanceAlpha.filters.ProposalCreated()),
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

      const delegates: { [key: string]: Delegate } = {...invDelegates};
      Object.entries(xinvDelegates).forEach(([address, xinvDelegate]) => {
        if(delegates[address]) {
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

      const getProposals = async (
        proposalCount: BigNumber,
        govContract: Contract,
        proposalsCreated: any[],
        votesCast: any[],
        quorumVotes: BigNumber,
        era: GovEra,
      ) => {
        const proposalData = await Promise.all(
          [...Array(proposalCount.toNumber()).keys()].map((i) =>
            govContract.proposals(i + 1)
          )
        );

        const startBlocks = await Promise.all(
          proposalData.map(({ startBlock }) =>
            provider.getBlock(startBlock.toNumber())
          )
        );

        const endBlocks = await Promise.all(
          proposalData.map(({ endBlock }) => provider.getBlock(endBlock.toNumber()))
        );

        return proposalData.map(
          (
            {
              id,
              proposer,
              eta,
              startBlock,
              endBlock,
              forVotes,
              againstVotes,
              canceled,
              executed,
            },
            i
          ) => {
            const { args } = proposalsCreated.find(({ args }) => args.id.eq(id));
            const votes = votesCast.filter(({ args }) => args?.proposalId.eq(id));

            const etaTimestamp = eta.toNumber() * 1000

            let status = ProposalStatus.queued;
            if (canceled) {
              status = ProposalStatus.canceled;
            } else if (executed) {
              status = ProposalStatus.executed;
            } else if (blockNumber <= startBlock.toNumber()) {
              status = ProposalStatus.pending;
            } else if (blockNumber <= endBlock.toNumber()) {
              status = ProposalStatus.active;
            } else if (forVotes.lte(againstVotes) || forVotes.lte(quorumVotes)) {
              status = ProposalStatus.defeated;
            } else if (eta.isZero()) {
              status = ProposalStatus.succeeded;
            } else if (Date.now() >= etaTimestamp + GRACE_PERIOD) {
              status = ProposalStatus.expired;
            }

            return {
              id: id.toNumber(),
              proposalNum: id.toNumber() + (era === GovEra.alpha ? 0 : proposalCountAlpha.toNumber()),
              era,
              proposer: proposer,
              etaTimestamp: etaTimestamp,
              startTimestamp: startBlocks[i].timestamp * 1000,
              endTimestamp: blockNumber > endBlock.toNumber() ? endBlocks[i].timestamp * 1000 : (startBlocks[i].timestamp * 1000) + PROPOSAL_DURATION,
              startBlock: startBlock.toNumber(),
              endBlock: endBlock.toNumber(),
              forVotes: parseFloat(formatUnits(forVotes)),
              againstVotes: parseFloat(formatUnits(againstVotes)),
              canceled: canceled,
              executed: executed,
              title: args.description.split("\n")[0].split("# ")[1],
              description: args.description.split("\n").slice(1).join("\n"),
              status,
              functions: args.targets.map((target: any, i: number) => ({
                target,
                signature: args.signatures[i],
                callData: args.calldatas[i],
              })),
              voters: votes.map((vote: any) => ({
                id: vote.args[1].toNumber(),
                voter: vote.args[0],
                support: vote.args[2],
                votes: parseFloat(formatUnits(vote.args[3])),
              })),
            };
          }
        );
      }

      const proposals = await getProposals(proposalCount, governance, proposalsCreated, votesCast, quorumVotes, GovEra.mills);
      const proposalsAlpha = await getProposals(proposalCountAlpha, governanceAlpha, proposalsCreatedAlpha, votesCastAlpha, quorumVotesAlpha, GovEra.alpha);

      const totalProposals = proposals.concat(proposalsAlpha);

      await client.set(`${chainId}-proposals`, JSON.stringify({
        blockNumber,
        timestamp: Date.now(),
        proposals: totalProposals,
      }))

      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
    }
  }
};