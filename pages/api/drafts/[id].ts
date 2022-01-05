import { isProposalFormInvalid } from '@inverse/util/governance';
import { getRedisClient } from '@inverse/util/redis';

const client = getRedisClient();

const getDraft = async (id) => {
    const drafts = JSON.parse(await client.get('drafts') || '[]');
    const draft = drafts.find((d) => d.publicDraftId.toString() === id);
    return draft
}

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { id } = query;

    let drafts
    let draft

    switch (method) {
        case 'GET':
            draft = await getDraft(id);

            if (!draft) {
                res.status(404).json({ status: 'error', message: 'Draft not found' })
                return
            }

            res.status(200).json({ status: 'success', draft })
            break
        case 'PUT':
            if (req.headers.authorization !== `Bearer ${process.env.DRAFT_PROPOSAL_PUBLISH_KEY}`) {
                res.status(401).json({ success: false, message: 'Unauthorized' })
                return
            };

            try {
                draft = await getDraft(id);

                if (!draft) {
                    res.status(404).json({ status: 'error', message: 'Draft not found' })
                    return
                }

                if (isProposalFormInvalid(draft)) {
                    res.status(400).json({ status: 'error', message: "Invalid Draft Proposal" })
                    return
                }

                drafts = JSON.parse(await client.get('drafts') || '[]');
                const index = drafts.findIndex((d) => d.publicDraftId.toString() === id);
                drafts.splice(index, 1, draft);

                await client.set('drafts', JSON.stringify(drafts));

                res.status(200).json({ status: 'success' })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'PUT'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}