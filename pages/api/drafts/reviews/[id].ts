import { SIGN_MSG, DRAFT_WHITELIST } from '@app/config/constants';
import { DraftReview } from '@app/types';
import { getRedisClient } from '@app/util/redis';
import { verifyMessage } from 'ethers/lib/utils';

const client = getRedisClient();

const redisKey = 'reviews';

export default async function handler(req, res) {
    const {
        query,
        method,
    } = req

    const { id, isProposal, era } = query;

    switch (method) {
        case 'GET':
            const key = isProposal === 'true' && !!era ? `proposal-${redisKey}-${era}-${id}` : `${redisKey}-${id}`
            const reviews = JSON.parse((await client.get(key)) || '[]');
            res.status(200).json({ status: 'success', reviews });
            break
        case 'POST':
            const { sig, status, comment } = req.body
            const whitelisted = DRAFT_WHITELIST;
            const sigAddress = verifyMessage(SIGN_MSG, sig);

            if (!whitelisted.includes(sigAddress.toLowerCase())) {
                res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                return
            };

            try {
                const reviews: DraftReview[] = JSON.parse((await client.get(`${redisKey}-${id}`)) || '[]');

                const sigReviewIndex = reviews.findIndex(review => review.reviewer === sigAddress);

                const review = {
                    reviewer: sigAddress,
                    timestamp: Date.now() - 30000,
                    status,
                    comment,
                };

                if (sigReviewIndex === -1) {
                    reviews.unshift(review);
                } else if (sigReviewIndex !== -1) {
                    if(status === 'remove') {
                        reviews.splice(sigReviewIndex, 1);
                    } else {
                        reviews.splice(sigReviewIndex, 1, review);
                    }
                }

                await client.set(`${redisKey}-${id}`, JSON.stringify(reviews));

                res.status(200).json({
                    status: 'success',
                    message: `Review ${status === 'ok' ? 'Added' : 'Removed'}`,
                    reviews,
                })
            } catch (e) {
                res.status(200).json({ status: 'error', message: 'An error occured' })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}