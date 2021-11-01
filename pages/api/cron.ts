import "source-map-support";

import { AlchemyProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import { GOVERNANCE, INV } from "@inverse/config/constants";
import { GOVERNANCE_ABI, INV_ABI } from "@inverse/config/abis";
import { formatUnits } from "ethers/lib/utils";
import { createNodeRedisClient } from 'handy-redis';

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

const client = createNodeRedisClient({
    url: process.env.REDIS_URL
});

export default async function handler(req, res) {
    // authenticate cron job
    if (req.method !== 'POST') res.status(405).json({success: false});
    else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) res.status(401).json({ success: false });
    else {
    // run delegates cron job
    try {
        const provider = new AlchemyProvider("homestead", process.env.ALCHEMY_API);
        const inv = new Contract(INV, INV_ABI, provider);
        const governance = new Contract(GOVERNANCE, GOVERNANCE_ABI, provider);
        const blockNumber = await provider.getBlockNumber();
    
        // fetch chain data
        const [
          delegateVotesChanged,
          delegateChanged,
          votesCast,
          proposalCount,
          quorumVotes,
          proposalsCreated,
        ] = await Promise.all([
          inv.queryFilter(inv.filters.DelegateVotesChanged()),
          inv.queryFilter(inv.filters.DelegateChanged()),
          governance.queryFilter(governance.filters.VoteCast()),
          governance.proposalCount(),
          governance.quorumVotes(),
          governance.queryFilter(governance.filters.ProposalCreated()),
        ]);
    
        const delegates = delegateVotesChanged.reduce(
          (delegates: any, { args }) => {
            if (args) {
              delegates[args.delegate] = {
                address: args.delegate,
                votingPower: parseFloat(formatUnits(args.newBalance)),
                delegators: [],
                votes: [],
              };
            }
            return delegates;
          },
          {}
        );
    
        Object.keys(delegates).forEach((delegate: string) => {
          const delegators = delegateChanged
            .filter(({ args }) => args.toDelegate === delegate)
            .map(({ args }) => args.delegator);
    
          const undelegators = delegateChanged
            .filter(({ args }) => args.fromDelegate === delegate)
            .map(({ args }) => args.delegator);
    
          const votes = votesCast.filter(({ args }) => args.voter === delegate);
    
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

        await client.set("delegates", JSON.stringify({
            blockNumber,
            timestamp: Date.now(),
            data: delegates,
        }))
    
        const proposalData = await Promise.all(
          [...Array(proposalCount.toNumber()).keys()].map((i) =>
            governance.proposals(i + 1)
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
    
        const proposals = proposalData.map(
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
              proposer: proposer,
              etaTimestamp: eta.toNumber() * 1000,
              startTimestamp: startBlocks[i].timestamp * 1000,
              endTimestamp: blockNumber > endBlock.toNumber()? endBlocks[i].timestamp * 1000: (startBlocks[i].timestamp * 1000) + PROPOSAL_DURATION,
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

        await client.set("proposals", JSON.stringify({
            blockNumber,
            timestamp: Date.now(),
            data: proposals   
        }))
    
        res.status(200).json({success:true});
      } catch (err) {
        console.error(err);
      }
    }
};