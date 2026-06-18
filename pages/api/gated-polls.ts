import { TOKENS_VIEWER } from "@app/config/constants";
import { getBnToNumber } from "@app/util/markets";
import { getGroupedMulticallOutputs, getMulticallOutput } from "@app/util/multicall";
import { getProvider } from "@app/util/providers";
import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { GATED_POLLS } from "@app/variables/poll-data";
import { Contract } from "ethers";
import { isAddress, verifyMessage } from "ethers/lib/utils";

const pollCodes = Object.keys(GATED_POLLS);

export const pollsCacheKey = 'gated-polls';

const getFormattedData = async (pollsData, contract, account) => {
    let distinctVoters = [];
    const formatted = pollCodes.map(pollCode => {
        const pollsVotes = pollsData[pollCode] || {};
        distinctVoters = distinctVoters.concat((pollsVotes.votes || []).map(pv => pv.account));
        return {
            pollCode,
            active: GATED_POLLS[pollCode].active,
            question: GATED_POLLS[pollCode].question,
            answers: GATED_POLLS[pollCode].answers.map(({ value, label }) => {
                return { value, label, nbVotes: pollsVotes[value] || 0 }
            }).concat({ value: 'abstain', label: 'Abstain', nbVotes: pollsVotes['abstain'] || 0 }),
        }
    });
    distinctVoters = [...new Set(distinctVoters)];

    const [invBalances, invVotes] = await getGroupedMulticallOutputs(
        [
            distinctVoters.map(v => ({
                contract, functionName: 'getAccountTotalInv', params: [v]
            })),
            distinctVoters.map(v => ({
                contract, functionName: 'getAccountTotalVotes', params: [v]
            })),
        ],
    );

    const invScores = {};

    distinctVoters.forEach((v, i) => {
        invScores[v] = Math.max(getBnToNumber(invBalances[i]), getBnToNumber(invVotes[i]));
    });

    return formatted.map(f => {
        const votesWithCurrentScore = pollsData[f.pollCode]?.votes.map(v => {
            return { ...v, invScore: invScores[v.account] }
        }) || [];
        const myVote = votesWithCurrentScore.find(v => v.account === account);
        const totalInvScore = votesWithCurrentScore.reduce((prev, curr) => prev+curr.invScore, 0);
        return {
            ...f,
            myVote: myVote?.answer,
            myScore: myVote?.invScore,
            totalInvScore,
            votes: votesWithCurrentScore,
            answers: f.answers.map(a => {
                return {
                    ...a,
                    totalInvScore: votesWithCurrentScore.filter(v => v.answer === a.value).reduce((prev, curr) => prev+curr.invScore, 0)
                }
            })
        }
    })
}

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

    if (!account || !isAddress(account)) {
        res.status(400).json({ status: 'error', message: 'Invalid account' })
        return;
    }

    const sigAddress = verifyMessage(`Verifying that I own ${account.toLowerCase()}`, sig).toLowerCase();

    if (!sigAddress || sigAddress.toLowerCase() !== account.toLowerCase()) {
        res.status(400).json({ status: 'error', message: 'Invalid account' })
        return;
    }

    let accountInvScore = 0;

    const contract = new Contract(TOKENS_VIEWER, ["function getAccountTotalInv(address) external view returns (uint256)", "function getAccountTotalVotes(address) external view returns (uint256)"], getProvider(1))

    try {
        const [invBalance, invVotes] = await getMulticallOutput(
            [
                {
                    contract, functionName: 'getAccountTotalInv', params: [account]
                },
                {
                    contract, functionName: 'getAccountTotalVotes', params: [account]
                },
            ],
        );
        accountInvScore = Math.max(getBnToNumber(invBalance), getBnToNumber(invVotes));
    } catch (e) {

    }

    if (accountInvScore < 10) {
        res.status(403).json({ status: 'error', message: 'You need at least 10 INV in balance or voting power.' });
        return;
    }

    const dbData = await getCacheFromRedis(pollsCacheKey, false) || {};
    const acc = account.toLowerCase();

    switch (method) {
        case 'POST':
            res.json(
                await getFormattedData(dbData, contract, acc)
            );
            break
        case 'PUT':
            if (!GATED_POLLS[poll]?.active || !pollCodes.includes(poll) || (!pollAnswerValues.includes(answer) && answer !== 'abstain')) {
                res.status(400).json({ status: 'error', message: 'Invalid parameters' })
                return
            }
            
            if (!dbData[poll]) {
                dbData[poll] = pollAnswerValues
                    .reduce((acc, possibleAnswer) => ({ ...acc, [possibleAnswer]: 0 }), { abstain: 0 });
            }
            
            const prevVote = dbData[poll][acc];
            if (!!prevVote) {
                dbData[poll][prevVote] = dbData[poll][answer] - 1;
            }
            dbData[poll][acc] = answer;
            if (!dbData[poll].votes) {
                dbData[poll].votes = [{ account: acc, answer }];
            } else {
                dbData[poll].votes.push({ account: acc, answer });
            }
            dbData[poll][answer] = (dbData[poll][answer] || 0) + 1;
            await redisSetWithTimestamp(pollsCacheKey, dbData);
            res.json({ status: 'success' });
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}