import { getQuizzQ1Frame } from "@app/frames/quizz/q1-frame";
import { getErrorFrame, getSuccessFrame } from "@app/util/frames";

const options = {
    1: 'Incorrect. sDOLA is Inverse’s yield bearing stablecoin!',
    2: 'Correct!',
    3: 'Incorrect. sDOLA is Inverse’s yield bearing stablecoin!',
};

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
    const fid = data?.untrustedData?.fid;
    const url = data?.untrustedData?.url;

    if (!email || !isValidEmail(email)) {
        return res.status(200).send(getErrorFrame(url, 'api/frames/newsletter/image-invalid-email?'));
    }
    else if (!fid) {
        return res.status(200).send(getErrorFrame(url));
    }

    return res.status(200).send(getSuccessFrame('api/frames/newsletter/image-success?'));
}