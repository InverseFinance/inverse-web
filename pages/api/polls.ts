import { getCacheFromRedis } from "@app/util/redis";

const POLLS = ['poll-1'];
const POLL_ANSWERS = {
    'poll-1': ['1', '2', '3', '4'],
}

export const pollsCacheKey = 'polls';

export default async function handler(req, res) {
    const {
        method,
    } = req

    const { poll, answer } = req.body;

    if (!POLLS.includes(poll) || !POLL_ANSWERS[poll]?.includes(answer)) {
        res.status(400).json({ status: 'error', message: 'Invalid parameters' })
        return
    }

    switch (method) {
        case 'GET':
            const pollsData = await getCacheFromRedis(pollsCacheKey, false) || {};
            res.json(pollsData);
            break
        case 'POST':
            const polls = await getCacheFromRedis(pollsCacheKey, false) || {};
            if (!polls[poll]) {
                polls[poll] = Object.values(POLL_ANSWERS[poll])
                    .reduce((acc, possibleAnswer) => ({ ...acc, [possibleAnswer]: 0 }), {});
            }
            polls[poll][answer] = (polls[poll][answer] || 0) + 1;
            res.json({ status: 'success' });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}