import "source-map-support";
import { getCacheFromRedis, getRedisClient } from '@app/util/redis';
import { ProposalStatus } from '@app/types';

const client = getRedisClient();

export default async function handler(req, res) {
  try {
    const data: any = await getCacheFromRedis(`1-proposals-v1.0.0`, false) || { proposals: [] };
    
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
