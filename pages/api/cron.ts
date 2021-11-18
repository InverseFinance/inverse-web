import "source-map-support";

import { Contract, BigNumber } from "ethers";
import { GOVERNANCE_ABI, INV_ABI } from "@inverse/config/abis";
import { formatUnits } from "ethers/lib/utils";
import { getNetworkConfig } from '@inverse/config/networks';
import { getProvider } from '@inverse/util/providers';
import { getRedisClient } from '@inverse/util/redis';
import { GovEra } from '@inverse/types';

const GRACE_PERIOD = 1209600;
const PROPOSAL_DURATION = 259200 * 1000 // 3 days in milliseconds

enum ProposalStatus {
  pending = "Pending",
  active = "Active",
  canceled = "Canceled",
  defeated = "Defeated",
  succeeded = "Succeeded",
  queued = "Queued",
  expired = "Expired",
  executed = "Executed",
}

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
      const provider = getProvider(chainId);
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
        // gov Mils
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
        // gov Mils
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

      const delegates = delegateVotesChanged.reduce(
        (invDelegates: any, { args }) => {
          if (args) {
            invDelegates[args.delegate] = {
              address: args.delegate,
              votingPower: parseFloat(formatUnits(args.newBalance)),
              delegators: [],
              votes: [],
            };
          }
          return invDelegates;
        },
        {}
      );

      const xinvExRate = await xinv.callStatic.exchangeRateCurrent();

      xinvDelegateVotesChanged.forEach(({ args }) => {
        if (args) {
          const xinvVotePower = parseFloat(formatUnits(args.newBalance)) * parseFloat(formatUnits(xinvExRate));

          delegates[args.delegate] = {
            address: args.delegate,
            votingPower: (delegates[args.delegate]?.votingPower || 0) + xinvVotePower,
            delegators: [],
            votes: [],
          };
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
            } else if (Date.now() >= eta.toNumber() + GRACE_PERIOD) {
              status = ProposalStatus.expired;
            }

            return {
              id: id.toNumber(),
              proposalNum: id.toNumber() + (era === GovEra.alpha ? 0 : proposalCountAlpha.toNumber()),
              era,
              proposer: proposer,
              etaTimestamp: eta.toNumber() * 1000,
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

      const proposals = await getProposals(proposalCount, governance, proposalsCreated, votesCast, quorumVotes, GovEra.mils);
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