import "source-map-support";
import { getNetworkConfigConstants } from '@app/util/networks';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { NetworkIds, GovEra } from '@app/types';
import { getGovProposals } from '@app/util/the-graph';
import { getProvider } from '@app/util/providers';
import { SECONDS_PER_BLOCK } from '@app/config/constants';
import removeMd from 'remove-markdown';
import { checkDraftRights, getProposalStatus } from '@app/util/governance';
import { Contract } from 'ethers';
import { GOVERNANCE_ABI } from '@app/config/abis';
import { getBnToNumber } from '@app/util/markets';
import { parseEther } from "@ethersproject/units";

export const proposalsCacheKey = '1-proposals-v1.0.1';

export default async function handler(req, res) {
  const cacheDuration = 30;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  try {
    const { sig } = req;
    const { GOVERNANCE } = getNetworkConfigConstants();

    const sigAddress = checkDraftRights(sig);

    const validCache = await getCacheFromRedis(proposalsCacheKey, !sigAddress, cacheDuration, true);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet, process.env.ALCHEMY_CRON, true);
    const govContract = new Contract(GOVERNANCE, GOVERNANCE_ABI, provider);

    const [blockNumber, quorumVotes, graphResult] = await Promise.all([
      provider.getBlockNumber(),
      govContract.quorumVotes(),
      getGovProposals({ size: 200 }),
    ]);

    const eras = {
      "0x35d9f4953748b318f18c30634ba299b237eedfff": GovEra.alpha,
      "0xbeccb6bb0aa4ab551966a7e4b97cec74bb359bf6": GovEra.mills,
    }

    const proposals = graphResult.data.proposals.map(p => {
      const era = eras[p.id.substring(0, 42)];
      const proposalId = parseInt(p.proposalId);

      const description = p.description.split("\n").slice(1).join("\n");

      const forVotes = p.receipts.filter(r => r.support.support === 1).reduce((prev, curr) => prev + parseInt(curr.weight)/1e18, 0);
      const againstVotes = p.receipts.filter(r => r.support.support === 0).reduce((prev, curr) => prev + parseInt(curr.weight)/1e18, 0);

      const [startBlock, endBlock] = [parseInt(p.startBlock), parseInt(p.endBlock)];

      let status = getProposalStatus(p.canceled, p.executed, parseInt(p.eta), startBlock, endBlock, blockNumber, againstVotes, forVotes, getBnToNumber(quorumVotes))

      const callsWithOrder = p.calls.map(c => ({
        ...c,
        order: parseInt(c.id.replace(`${p.id}/`, '')),
      }));
      callsWithOrder.sort((a, b) => a.order - b.order);
      const functions = callsWithOrder.map(c => {
        return {
          target: c.target.id,
          signature: c.signature,
          callData: c.calldata,
          value: parseEther(c.value).toString(),
        }
      });

      return {        
        id: proposalId,
        proposalNum: proposalId + (era === GovEra.alpha ? 0 : 29),
        era,
        proposer: p.proposer.id,
        etaTimestamp: parseInt(p.eta) * 1000,
        startTimestamp: parseInt(p.proposalCreated[0].timestamp) * 1000,
        endTimestamp:
          (endBlock - Math.max(parseInt(p.startBlock), blockNumber)) * SECONDS_PER_BLOCK * 1000 + Date.now(),
        startBlock,
        endBlock,
        forVotes,
        againstVotes,
        canceled: p.canceled,
        executed: p.executed,
        executionTimestamp: p.executed ? parseInt(p.proposalExecuted[0].timestamp) * 1000 : undefined,
        title: p.description.split("\n")[0].split("# ")[1],
        description: description,
        descriptionAsText: removeMd(description),
        status,        
        functions,
        voters: p.receipts.map((vote: any, i) => ({
          id: i+1,
          voter: vote.voter.id,
          support: !!vote.support.support,
          votes: parseInt(vote.weight)/1e18,
        })),
      }
    });

    proposals.sort((a, b) => b.proposalNum - a.proposalNum);

    const result = {
      blockNumber: blockNumber,
      timestamp: Date.now(),
      proposals,      
      success: true,
    }

    await redisSetWithTimestamp(proposalsCacheKey, result, true);
    
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
  }
};
