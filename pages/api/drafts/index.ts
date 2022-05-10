
import { isProposalFormInvalid, isProposalActionInvalid, getProposalActionFromFunction } from '@app/util/governance';
import { getRedisClient } from '@app/util/redis';
import { ProposalFormActionFields } from '@app/types';
import { verifyMessage } from 'ethers/lib/utils';
import { SIGN_MSG, DRAFT_WHITELIST } from '@app/config/constants';

const client = getRedisClient();

export default async function handler(req, res) {
    const {
        method,
    } = req
    let drafts

    switch (method) {
        case 'GET':
            drafts = await client.get('drafts') || '[]';
            res.status(200).json({ status: 'success', drafts: JSON.parse(drafts) })
            break
        case 'POST':
            try {
                const { sig, ...draft } = req.body
                const whitelisted = DRAFT_WHITELIST;
                const sigAddress = verifyMessage(SIGN_MSG, sig).toLowerCase();

                if (!whitelisted.includes(sigAddress)) {
                    res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                    return
                };

                const actions = draft.functions
                    .map((f, i) => getProposalActionFromFunction(i + 1, f))
                    .filter((action: ProposalFormActionFields) => !isProposalActionInvalid(action));

                if (isProposalFormInvalid({ title: draft.title, description: draft.description, actions })) {
                    res.status(400).json({ status: 'warning', message: "Invalid Draft Proposal" })
                    return
                }

                drafts = JSON.parse(await client.get('drafts') || '[]');

                if(drafts.length === 10) {
                    res.status(403).json({ status: 'warning', message: "Maximum number of public drafts is 10" })
                    return
                }

                const id = (parseInt(await client.get('lastDraftId') || '0')) + 1;

                drafts.unshift({ ...draft, publicDraftId: id, createdAt: Date.now(), createdBy: sigAddress });

                await client.set('drafts', JSON.stringify(drafts));
                await client.set('lastDraftId', id.toString());

                res.status(200).json({ status: 'success', publicDraftId: id, message: 'Draft Published' })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}