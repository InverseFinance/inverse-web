import "source-map-support";
import { getCacheFromRedis, getRedisClient } from '@app/util/redis';
import { ProposalStatus } from '@app/types';
import { proposalsCacheKey } from "./proposals";

const client = getRedisClient();

export default async function handler(req, res) {
  const cacheDuration = 99999;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  try {
    return res.status(200).json({
      blockNumber: 0,
      timestamp: 0,
      activeProposalsKeys: [],
      draftKeys: [],
      keys: [],
    });
    const data: any = await getCacheFromRedis(proposalsCacheKey, false, 0, true) || { proposals: [] };
    
    if (!data) {
      res.status(404).json({ success: false });
      return;
    }

    const activeProposalsKeys = data.proposals.filter(p => [ProposalStatus.active].includes(p.status))
      .map(p => `active-${p.proposalNum}`);

    const draftKeys = JSON.parse(await client.get('drafts') || '[]').map(p => `draft-${p.publicDraftId}`);

    res.status(200).json({
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
      activeProposalsKeys,
      draftKeys,
      keys: activeProposalsKeys.concat(draftKeys),
    });
  } catch (err) {
    console.error(err);
  }
};
