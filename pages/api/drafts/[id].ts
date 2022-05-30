import { SIGN_MSG, DRAFT_WHITELIST } from '@app/config/constants';
import { isProposalFormInvalid, isProposalActionInvalid, getProposalActionFromFunction } from '@app/util/governance';
import { getRedisClient } from '@app/util/redis';
import { verifyMessage } from 'ethers/lib/utils';
import { ProposalFormActionFields } from '@app/types';

const client = getRedisClient();

const getDraft = async (id) => {
    const drafts = JSON.parse(await client.get('drafts') || '[]');
    const draft = drafts.find((d) => d.publicDraftId.toString() === id);
    return draft
}

const checkRights = (sig: string) => {
    const sigAddress = verifyMessage(SIGN_MSG, sig).toLowerCase();

    if (!DRAFT_WHITELIST.includes(sigAddress)) {
        return null
    };

    return sigAddress;
}

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { id } = query;

    let drafts
    let draft
    let sigAddress;

    const { sig, proposalId, ...updatedData } = req.body

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
        case 'DELETE':
            sigAddress = checkRights(sig);
            if (!sigAddress) {
                res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                return
            }

            try {
                draft = await getDraft(id);

                if (!draft) {
                    res.status(404).json({ status: 'warning', message: 'Draft not found' })
                    return
                }

                drafts = JSON.parse(await client.get('drafts') || '[]');
                const index = drafts.findIndex((d) => d.publicDraftId.toString() === id);

                if (method === 'PUT') {
                    // submitted the proposal
                    if (proposalId) {
                        const draftReviews = JSON.parse(await client.get(`reviews-${id}`) || '[]');
                        await client.set(`proposal-reviews-${proposalId}`, JSON.stringify(draftReviews));
                    } else {
                        const updatedDraft = {
                            ...updatedData,
                            publicDraftId: id,
                            createdAt: draft.createdAt,
                            updatedAt: Date.now(),
                            updatedBy: sigAddress,
                            createdBy: draft.createdBy,
                        };

                        const actions = updatedDraft.functions
                            .map((f, i) => getProposalActionFromFunction(i + 1, f))
                            .filter((action: ProposalFormActionFields) => !isProposalActionInvalid(action));

                        if (isProposalFormInvalid({ title: updatedDraft.title, description: updatedDraft.description, actions })) {
                            res.status(400).json({ status: 'error', message: "Invalid Draft Proposal" })
                            return
                        }
                        drafts.splice(index, 1, updatedDraft);
                    }
                } else {
                    drafts.splice(index, 1);
                }

                await client.set('drafts', JSON.stringify(drafts));

                res.status(200).json({ status: 'success', message: `Draft ${method === 'PUT' ? 'updated' : 'removed'}` })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'PUT'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}