import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";

const POLLS = ['poll-0'];
const POLL_ANSWERS = {
    'poll-0': ['1', '2', '3'],
}

export const pollsCacheKey = 'polls';

export default async function handler(req, res) {
    const {
        method,
    } = req

    const { poll, answer } = req.body;

    switch (method) {
        case 'GET':
            const pollsData = await getCacheFromRedis(pollsCacheKey, false) || {};
            res.json(pollsData);
            break
        case 'POST':
            if (!POLLS.includes(poll) || (!POLL_ANSWERS[poll]?.includes(answer) && answer !== 'abstain')) {
                res.status(400).json({ status: 'error', message: 'Invalid parameters' })
                return
            }
            const polls = await getCacheFromRedis(pollsCacheKey, false) || {};
            if (!polls[poll]) {
                polls[poll] = Object.values(POLL_ANSWERS[poll])
                    .reduce((acc, possibleAnswer) => ({ ...acc, [possibleAnswer]: 0 }), { abstain: 0 });
            }
            polls[poll][answer] = (polls[poll][answer] || 0) + 1;
            await redisSetWithTimestamp(pollsCacheKey, polls);
            res.json({ status: 'success' });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}