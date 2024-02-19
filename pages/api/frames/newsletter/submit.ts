import { FRAME_BASE_URL, getErrorFrame, getSuccessFrame } from "@app/util/frames";
import { getFarcasterUserAddresses, setFrameCheckAction, validateFrameMessage } from "@app/util/frames-server";
import { getTimestampFromUTCDate } from "@app/util/misc";
import { getNewsletterRegisterFrame } from "./register-frame";
import { BURN_ADDRESS } from "@app/config/constants";

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
    const url = data?.untrustedData?.url;

    const now = Date.now();

    const isLocal = FRAME_BASE_URL.includes('localhost');
    if (!isLocal && !data?.trustedData?.messageBytes) {
        return res.status(200).send(getErrorFrame(url));
    }

    const verifiedMessage = !isLocal ? await validateFrameMessage(data?.trustedData?.messageBytes) : {};
    if (!isLocal && (!verifiedMessage.valid || !verifiedMessage.message.data.fid)) {
        return res.status(200).send(getErrorFrame(url));
    }
    const fid = isLocal ? unverifiedFid : verifiedMessage.message.data.fid;
    const email = isLocal ? unverifiedEmail : Buffer.from(verifiedMessage.message.data.frameActionBody.inputText, 'base64');

    if (now > contestEndTimestamp) {
        return res.status(200).send(getErrorFrame(url, 'api/frames/newsletter/image-contest-ended'));
    }
    else if (!fid) {
        return res.status(200).send(getErrorFrame(url));
    }
    else if (buttonId === 1 && !email) {
        return res.status(200).send(getNewsletterRegisterFrame());
    }
    else if (!email || !isValidEmail(email)) {
        return res.status(200).send(getErrorFrame(url, 'api/frames/newsletter/image-invalid-email?'));
    }
    const fidAddresses = isLocal ? [BURN_ADDRESS] : await getFarcasterUserAddresses(fid);

    const dataToSave = { sub: true, email, timestamp: now, verifiedMessage, fidAddresses };
    setFrameCheckAction('newsletter-contest', 'subscribe', dataToSave, fid);    

    return res.status(200).send(getSuccessFrame('api/frames/newsletter/image-success?'));
}