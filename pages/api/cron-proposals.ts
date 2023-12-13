import "source-map-support";

import { Contract, BigNumber } from "ethers";
import { GOVERNANCE_ABI } from "@app/config/abis";
import { formatUnits } from "ethers/lib/utils";
import { getNetworkConfigConstants } from '@app/util/networks';
import { getProvider } from '@app/util/providers';
import { getRedisClient } from '@app/util/redis';
import { GovEra, NetworkIds } from '@app/types';
import { SECONDS_PER_BLOCK } from '@app/config/constants';
import { checkDraftRights, getProposalStatus } from '@app/util/governance';
import { ProposalStatus } from '@app/types';
import { Proposal } from '@app/types';
import { addBlockTimestamps } from '@app/util/timestamps';
import removeMd from 'remove-markdown';

const client = getRedisClient();

export default async function handler(req, res) {
  // authenticate cron job
  const { sig } = req.body;
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  else if (
    req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`
    && !checkDraftRights(sig)
  ) res.status(401).json({ success: false });
  else {
    // run delegates cron job
    try {
      const chainId = process.env.NEXT_PUBLIC_CHAIN_ID!;
      // await client.del(`${chainId}-proposals-archived-v1.0.0`)
      const { GOVERNANCE, GOVERNANCE_ALPHA: GOV_ALPHA } = getNetworkConfigConstants()!;
      // use specific AlchemyApiKey for the cron
      const provider = getProvider(chainId, process.env.ALCHEMY_CRON, true);
      const governance = new Contract(GOVERNANCE, GOVERNANCE_ABI, provider);
      const governanceAlpha = new Contract(GOV_ALPHA, GOVERNANCE_ABI, provider);
      const blockNumber = await provider.getBlockNumber();

      // fetch chain data
      const [
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

      const getProposals = async (
        proposalCount: BigNumber,
        govContract: Contract,
        proposalsCreated: any[],
        votesCast: any[],
        quorumVotes: BigNumber,
        era: GovEra,
        previouslyArchivedProposals: Proposal[]
      ) => {
        const ids = [...Array(proposalCount.toNumber()).keys()].map((i) => (i + 1));

        const archivedIds = previouslyArchivedProposals.filter(archive => archive.era === era).map(archive => archive.id);
        const nonArchivedIds = ids.filter(id => !archivedIds.includes(id));

        const proposalData = await Promise.all(
          nonArchivedIds.map((id) =>
            govContract.proposals(id)
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

        const govExecutions = await govContract.queryFilter(govContract.filters.ProposalExecuted());
        const timestamps = await addBlockTimestamps(govExecutions.map(e => e.blockNumber), NetworkIds.mainnet);        

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

            let status = getProposalStatus(canceled, executed, eta, startBlock, endBlock, blockNumber, againstVotes, forVotes, quorumVotes)

            const execEvent = executed ? govExecutions.find(e => e.args.id.toString() === id.toString()) : undefined;

            const description = args.description.split("\n").slice(1).join("\n");

            return {
              id: id.toNumber(),
              proposalNum: id.toNumber() + (era === GovEra.alpha ? 0 : proposalCountAlpha.toNumber()),
              era,
              proposer: proposer,
              etaTimestamp: etaTimestamp,
              startTimestamp: startBlocks[i].timestamp * 1000,
              endTimestamp: blockNumber > endBlock.toNumber() ?
                endBlocks[i].timestamp * 1000
                :
                (endBlock.toNumber() - Math.max(startBlock.toNumber(), blockNumber)) * SECONDS_PER_BLOCK * 1000 + Date.now(),
              startBlock: startBlock.toNumber(),
              endBlock: endBlock.toNumber(),
              forVotes: parseFloat(formatUnits(forVotes)),
              againstVotes: parseFloat(formatUnits(againstVotes)),
              canceled: canceled,
              executed: executed,
              executionTimestamp: executed && !!execEvent ? timestamps[NetworkIds.mainnet][execEvent.blockNumber] * 1000 : undefined,
              title: args.description.split("\n")[0].split("# ")[1],
              description: description,
              descriptionAsText: removeMd(description),
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

      const previouslyArchivedProposals = JSON.parse(await client.get(`${chainId}-proposals-archived-v1.0.1`) || '{"proposals": []}').proposals;

      const proposals = await getProposals(proposalCount, governance, proposalsCreated, votesCast, quorumVotes, GovEra.mills, previouslyArchivedProposals);
      const proposalsAlpha = await getProposals(proposalCountAlpha, governanceAlpha, proposalsCreatedAlpha, votesCastAlpha, quorumVotesAlpha, GovEra.alpha, previouslyArchivedProposals);

      const totalProposals = proposals.concat(proposalsAlpha, previouslyArchivedProposals);

      await client.set(`${chainId}-proposals`, JSON.stringify({
        blockNumber,
        timestamp: Date.now(),
        proposals: totalProposals,
      }))

      const currentArchivedProposals = totalProposals.filter((p) => {
        return [ProposalStatus.canceled, ProposalStatus.executed, ProposalStatus.defeated, ProposalStatus.expired].includes(p.status)
      });

      await client.set(`${chainId}-proposals-archived-v1.0.1`, JSON.stringify({
        blockNumber,
        timestamp: Date.now(),
        proposals: currentArchivedProposals,
      }))

      if (process.env.NODE_ENV === 'production') {
        // poke pages to trigger cache revalidation
        const previouslyArchivedNums = previouslyArchivedProposals.map(p => p.proposalNum);
        const toRefresh = totalProposals
          .filter(p => {
            return !previouslyArchivedNums.includes(p.proposalNum);
          })
          .map(p => `https://${req.headers.host}/governance/proposals/${p.era}/${p.id}`)
        await Promise.all(toRefresh.map(p => fetch(p)));
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false });
    }
  }
};