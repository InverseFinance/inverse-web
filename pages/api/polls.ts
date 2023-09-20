import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { POLLS } from "@app/variables/poll-data";

const pollCodes = Object.keys(POLLS);

export const pollsCacheKey = 'polls';

export default async function handler(req, res) {
    const {
        method,
    } = req

    const { poll, answer } = req.body;

    const pollAnswerValues = POLLS[poll]?.answers?.map(({ value }) => value) || [];

    switch (method) {
        case 'GET':
            const pollsData = (await getCacheFromRedis(pollsCacheKey, false)) || {};            
            const formatted = pollCodes.map(pollCode => {
                const pollsVotes = pollsData[pollCode] || {};
                return {
                    question: POLLS[pollCode].question,
                    answers: POLLS[pollCode].answers.map(({ value, label }) => {
                        return { value, label, votes: pollsVotes[value] || 0 }
                    }).concat({ value: 'abstain', label: 'Abstain', votes: pollsVotes['abstain'] || 0 }),
                }
            });
            res.json(formatted);
            break
        case 'POST':
            if (!pollCodes.includes(poll) || (!pollAnswerValues.includes(answer) && answer !== 'abstain')) {
                res.status(400).json({ status: 'error', message: 'Invalid parameters' })
                return
            }
            const polls = (await getCacheFromRedis(pollsCacheKey, false)) || {};
            if (!polls[poll]) {
                polls[poll] = pollAnswerValues
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