import "source-map-support";
import { getNetworkConfig } from '@inverse/config/networks';
import { getRedisClient } from '@inverse/util/redis';
import { NetworkIds, ProposalStatus } from '@inverse/types';

const client = getRedisClient();

export default async function handler(req, res) {
  try {
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(NetworkIds.mainnet, true)!;
    if (!networkConfig?.governance) {
      res.status(403).json({ success: false, message: `No Governance support on ${networkConfig.chainId} network` });
    }
    let data: any = await client.get(`${networkConfig.chainId}-proposals`);

    if (!data) {
      res.status(404).json({ success: false });
      return;
    } else {
      data = JSON.parse(data)
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
