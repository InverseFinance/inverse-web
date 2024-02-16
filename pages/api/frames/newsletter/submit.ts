import { getErrorFrame, getSuccessFrame } from "@app/util/frames";
import { setFrameCheckAction } from "@app/util/frames-server";
import { getTimestampFromUTCDate } from "@app/util/misc";
import { getNewsletterRegisterFrame } from "./register-frame";

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
    const email = data?.untrustedData?.inputText;
    const buttonId = data?.untrustedData?.buttonIndex;
    const fid = data?.untrustedData?.fid;
    const url = data?.untrustedData?.url;    

    const now = Date.now();

    if(now > contestEndTimestamp) {
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
    
    setFrameCheckAction('newsletter-contest', 'subscribe', { sub: true, email: email, timestamp: now, fid }, fid);    
    return res.status(200).send(getSuccessFrame('api/frames/newsletter/image-success?'));
}