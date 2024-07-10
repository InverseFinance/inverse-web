import { FRAME_BASE_URL, getRetryFrame, getSuccessFrame } from "@app/util/frames";
import { getFarcasterUserAddresses, isFollowingInverseFarcaster, setFrameCheckAction, validateFrameMessage } from "@app/util/frames-server";
import { getTimestampFromUTCDate } from "@app/util/misc";
import { BURN_ADDRESS } from "@app/config/constants";
import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";
import { getQuizzQ1Frame } from "./q1-frame";
import { getQuizzQ2Frame } from "./q2-frame";
import { getQuizzQ3Frame } from "./q3-frame";

const contestEndTimestamp = getTimestampFromUTCDate('2024-02-29');

const QUESTIONS_ANSWERS = {
    '1': '2',
    '2': '2',
    '3': '1',
};

export default async function handler(req, res) {
    const data = req.body;
    const { q, ask, end } = req.query;

    const unverifiedButtonId = data?.untrustedData?.buttonIndex?.toString();
    const unverifiedFid = data?.untrustedData?.fid;
    const backUrl = FRAME_BASE_URL + '/api/frames/quizz/submit?q=1&ask=true';
    const contestId = 'quizz-contest-feb';

    const now = Date.now();

    const isLocal = FRAME_BASE_URL.includes('localhost');

    const verifiedMessage = !isLocal ? await validateFrameMessage(data?.trustedData?.messageBytes) : {};
    const fid = isLocal ? unverifiedFid : verifiedMessage.message.data.fid;
    const isFollowingInverse = await isFollowingInverseFarcaster(fid);

    if (!isFollowingInverse) {
        return res.status(200).send(getRetryFrame(backUrl, '/api/frames/images/follow-inverse-first'));
    }

    if (now > contestEndTimestamp) {
        return res.status(200).send(getRetryFrame(backUrl, 'api/frames/images/contest-ended'));
    }
    else {
        if (ask === 'true') {
            if (q === '1') {
                return res.status(200).send(getQuizzQ1Frame());
            } else if (q === '2') {
                return res.status(200).send(getQuizzQ2Frame());
            } else if (q === '3') {
                return res.status(200).send(getQuizzQ3Frame());
            }
        } else {
            if (q === '1') {
                if (QUESTIONS_ANSWERS[q] === unverifiedButtonId) {
                    return res.status(200).send(getQuizzQ1Frame(true));
                } else {
                    return res.status(200).send(getRetryFrame(backUrl, 'api/frames/quizz/images-qa?q=1&answer=incorrect'));
                }
            } else if (q === '2') {
                if (QUESTIONS_ANSWERS[q] === unverifiedButtonId) {
                    return res.status(200).send(getQuizzQ2Frame(true));
                } else {
                    return res.status(200).send(getRetryFrame(backUrl, 'api/frames/quizz/images-qa?q=2&answer=incorrect'));
                }
            } else if (!end && q === '3') {
                if (QUESTIONS_ANSWERS[q] === unverifiedButtonId) {
                    return res.status(200).send(getQuizzQ3Frame(true));
                } else {
                    return res.status(200).send(getRetryFrame(backUrl, 'api/frames/quizz/images-qa?q=3&answer=incorrect'));
                }
            }
        }

        if(end !== 'true') {
            return res.status(200).send(getRetryFrame(backUrl));
        }
        
        if (!isLocal && !data?.trustedData?.messageBytes) {
            return res.status(200).send(getRetryFrame(backUrl));
        }

        const verifiedMessage = !isLocal ? await validateFrameMessage(data?.trustedData?.messageBytes) : {};
        if (!isLocal && (!verifiedMessage.valid || !verifiedMessage.message.data.fid)) {
            return res.status(200).send(getRetryFrame(backUrl));
        }
        const fid = isLocal ? unverifiedFid : verifiedMessage.message.data.fid;
        const buttonId = isLocal ? unverifiedButtonId : Buffer.from(verifiedMessage.message.data.frameActionBody.buttonId, 'base64').toString();

        const fidAddresses = isLocal ? [BURN_ADDRESS] : await getFarcasterUserAddresses(fid);

        if (!fidAddresses?.length) {
            return res.status(200).send(getRetryFrame(backUrl, 'api/frames/images/no-wallet'));
        }

        const dataToSave = { timestamp: now, verifiedMessage, fidAddresses };
        const check = await setFrameCheckAction(contestId, 'answer', dataToSave, fid);

        if (check.alreadyUsed) {
            return res.status(200).send(getSuccessFrame('api/frames/images/already-participated'));
        } else if (check.saved) {
            const subscribersData = await getCacheFromRedis('frames:' + contestId, false) || { subscribers: [] };
            const newList = subscribersData?.subscribers.concat([{ timestamp: now, mainAddress: fidAddresses[0], fidAddresses }]);
            await redisSetWithTimestamp('frames:' + contestId, { ...subscribersData, subscribers: newList, timestamp: now });
            return res.status(200).send(getSuccessFrame('api/frames/images/sDOLA-success'));
        }

        return res.status(200).send(getRetryFrame(backUrl, 'api/frames/images/something-went-wrong'));
    }
}