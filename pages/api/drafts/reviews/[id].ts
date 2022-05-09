import { DRAFT_SIGN_MSG, DRAFT_WHITELIST } from '@app/config/constants';
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

    const { id } = query;

    switch (method) {
        case 'GET':
            const reviews = JSON.parse(await client.get(`${redisKey}-${id}`) || '[]');
            res.status(200).json({ status: 'success', reviews });
            break
        case 'POST':
            const { sig, status, comment } = req.body
            const whitelisted = DRAFT_WHITELIST;
            const sigAddress = verifyMessage(DRAFT_SIGN_MSG, sig);

            if (!whitelisted.includes(sigAddress.toLowerCase())) {
                res.status(401).json({ status: 'warning', message: 'Unauthorized' })
                return
            };

            try {
                const reviews: DraftReview[] = JSON.parse(await client.get(`${redisKey}-${id}`) || '[]');

                const sigReviewIndex = reviews.findIndex(review => review.reviewer === sigAddress);

                if (sigReviewIndex === -1) {
                    reviews.unshift({
                        reviewer: sigAddress,
                        timestamp: Date.now() - 30000,
                        status,
                        comment,
                    });
                } else if (sigReviewIndex !== -1 && status === 'remove') {
                    reviews.splice(sigReviewIndex, 1);
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