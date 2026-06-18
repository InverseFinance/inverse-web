import { TOKENS_VIEWER } from "@app/config/constants";
import { getBnToNumber } from "@app/util/markets";
import { getProvider } from "@app/util/providers";
import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { GATED_POLLS } from "@app/variables/poll-data";
import { Contract } from "ethers";
import { isAddress, verifyMessage } from "ethers/lib/utils";

const pollCodes = Object.keys(GATED_POLLS);

export const pollsCacheKey = 'gated-polls';

export default async function handler(req, res) {
    const {
        method,
    } = req

    const { account, poll, answer, sig } = req.body;

    res.setHeader('Cache-Control', `public, max-age=5`);
    res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
    res.setHeader('Access-Control-Allow-Origin', `*`);
    res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,PUT`);

    if (method === 'OPTIONS') {
        return res.status(200).end();
    }

    const pollAnswerValues = GATED_POLLS[poll]?.answers?.map(({ value }) => value) || [];

    if(!account || !isAddress(account)) {
        res.status(400).json({ status: 'error', message: 'Invalid account' })
        return;
    }

    const sigAddress = verifyMessage(`Verifying that I own ${account.toLowerCase()}`, sig).toLowerCase();
    
    if(!sigAddress || sigAddress.toLowerCase() !== account.toLowerCase()) {
        res.status(400).json({ status: 'error', message: 'Invalid account' })
        return;
    }

    let accountTotalInvBal = 0;
    try {
        const contract = new Contract(TOKENS_VIEWER, ["function getAccountTotalInv(address) external view returns (uint256)"], getProvider(1))
        const accountTotalInvBalBn = await contract.getAccountTotalInv(account);
        accountTotalInvBal = getBnToNumber(accountTotalInvBalBn);
    } catch(e) {

    }

    if(accountTotalInvBal < 10) {
        res.status(403).json({ status: 'error', message: 'Not enough INV' });
        return;
    }

    switch (method) {
        case 'POST':
            const pollsData = await getCacheFromRedis(pollsCacheKey, false) || {};            
            const formatted = pollCodes.map(pollCode => {
                const pollsVotes = pollsData[pollCode] || {};
                return {
                    question: GATED_POLLS[pollCode].question,
                    answers: GATED_POLLS[pollCode].answers.map(({ value, label }) => {
                        return { value, label, votes: pollsVotes[value] || 0 }
                    }).concat({ value: 'abstain', label: 'Abstain', votes: pollsVotes['abstain'] || 0 }),
                }
            });
            res.json(formatted);
            break
        case 'PUT':
            if (!GATED_POLLS[poll]?.active || !pollCodes.includes(poll) || (!pollAnswerValues.includes(answer) && answer !== 'abstain')) {
                res.status(400).json({ status: 'error', message: 'Invalid parameters' })
                return
            }
            const polls = await getCacheFromRedis(pollsCacheKey, false) || {};
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