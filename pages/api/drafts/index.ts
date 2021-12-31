
import { isProposalFormInvalid } from '@inverse/util/governance';
import { getRedisClient } from '@inverse/util/redis';

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
                res.status(401).json({ success: false, message: 'Unauthorized' })
                return
            };

            try {
                const draft = req.body

                if (isProposalFormInvalid(draft)) {
                    res.status(400).json({ status: 'error', message: "Invalid Draft Proposal" })
                    return
                }

                drafts = JSON.parse(await client.get('drafts') || '[]');
                const id = (parseInt(await client.get('lastDraftId') || '0')) + 1;

                drafts.unshift({ ...draft, publicDraftId: id });

                await client.set('drafts', JSON.stringify(drafts));
                await client.set('lastDraftId', id.toString());

                res.status(200).json({ status: 'ok', publicDraftId: id })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}