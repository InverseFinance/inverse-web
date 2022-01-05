
import { isProposalFormInvalid, getProposalActionFunction, isProposalActionInvalid, getProposalActionFromFunction } from '@inverse/util/governance';
import { getRedisClient } from '@inverse/util/redis';
import { ProposalFormActionFields } from '@inverse/types';

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
            if (req.headers.authorization !== `Bearer ${process.env.DRAFT_PROPOSAL_PUBLISH_KEY}`) {
                res.status(401).json({ status: 'error', message: 'Unauthorized' })
                return
            };

            try {
                const draft = req.body
                const actions = draft.functions
                    .map(getProposalActionFromFunction)
                    .filter((action: ProposalFormActionFields) => !isProposalActionInvalid(action));

                if (isProposalFormInvalid({ title: draft.title, description: draft.description, actions })) {
                    res.status(400).json({ status: 'error', message: "Invalid Draft Proposal" })
                    return
                }

                drafts = JSON.parse(await client.get('drafts') || '[]');
                const id = (parseInt(await client.get('lastDraftId') || '0')) + 1;

                drafts.unshift({ ...draft, publicDraftId: id });

                await client.set('drafts', JSON.stringify(drafts));
                await client.set('lastDraftId', id.toString());

                res.status(200).json({ status: 'success', publicDraftId: id })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}