
import { isProposalFormInvalid, isProposalActionInvalid, getProposalActionFromFunction } from '@inverse/util/governance';
import { getRedisClient } from '@inverse/util/redis';
import { ProposalFormActionFields } from '@inverse/types';
import { verifyMessage } from 'ethers/lib/utils';
import { DRAFT_SIGN_MSG } from '@inverse/config/constants';

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
                const whitelisted = (process?.env?.DRAFT_ADDRESS_WHITELIST || '')?.replace(/\s/, '').toLowerCase().split(',');
                const sigAddress = verifyMessage(DRAFT_SIGN_MSG, sig).toLowerCase();

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

                drafts.unshift({ ...draft, publicDraftId: id });

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