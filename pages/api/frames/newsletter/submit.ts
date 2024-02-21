import { FRAME_BASE_URL, getRetryFrame, getSuccessFrame } from "@app/util/frames";
import { getFarcasterUserAddresses, isFollowingInverseFarcaster, setFrameCheckAction, validateFrameMessage } from "@app/util/frames-server";
import { getTimestampFromUTCDate } from "@app/util/misc";
import { getNewsletterRegisterFrame } from "./register-frame";
import { BURN_ADDRESS } from "@app/config/constants";
import { getCacheFromRedis, redisSetWithTimestamp } from "@app/util/redis";

const contestEndTimestamp = getTimestampFromUTCDate('2024-02-29');

const isValidEmail = (email: string) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

export default async function handler(req, res) {
    const data = req.body;

    const buttonId = data?.untrustedData?.buttonIndex;
    const unverifiedEmail = data?.untrustedData?.inputText;
    const unverifiedFid = data?.untrustedData?.fid;    
    const backUrl = FRAME_BASE_URL+'/api/frames/newsletter/submit';
    const contestId = 'newsletter-contest-feb';

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
    else if (buttonId === 1 && !unverifiedEmail) {
        return res.status(200).send(getNewsletterRegisterFrame());
    }
    else {        
        if (!isLocal && !data?.trustedData?.messageBytes) {
            return res.status(200).send(getRetryFrame(backUrl));
        }
        
        if (!isLocal && (!verifiedMessage.valid || !verifiedMessage.message.data.fid)) {
            return res.status(200).send(getRetryFrame(backUrl));
        }        
        const email = isLocal ? unverifiedEmail : Buffer.from(verifiedMessage.message.data.frameActionBody.inputText, 'base64').toString();
        
        if (!email || !isValidEmail(email)) {
            return res.status(200).send(getRetryFrame(backUrl, 'api/frames/images/invalid-email?'));
        }
        const fidAddresses = isLocal ? [BURN_ADDRESS] : await getFarcasterUserAddresses(fid);

        if(!fidAddresses?.length) {
            return res.status(200).send(getRetryFrame(backUrl, 'api/frames/images/no-wallet'));
        }

        const dataToSave = { sub: true, email, timestamp: now, verifiedMessage, fidAddresses };
        const check = await setFrameCheckAction(contestId, 'subscribe', dataToSave, fid);

        if(check.alreadyUsed) {
            return res.status(200).send(getSuccessFrame('api/frames/images/already-participated'));
        } else if(check.saved) {
            const subscribersData = await getCacheFromRedis('frames:'+contestId, false) || { subscribers: [] };
            const newList = subscribersData?.subscribers.concat([{ email, timestamp: now, mainAddress: fidAddresses[0], fidAddresses }]);
            await redisSetWithTimestamp('frames:'+contestId, { ...subscribersData, subscribers: newList, timestamp: now });            
            return res.status(200).send(getSuccessFrame('api/frames/images/sDOLA-success'));
        }
        return res.status(200).send(getRetryFrame(backUrl, 'api/frames/images/something-went-wrong'));
    }    
}