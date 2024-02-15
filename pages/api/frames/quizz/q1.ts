import { getErrorFrame } from "@app/util/frames";

const options = {
  1: 'Incorrect. sDOLA is Inverse’s yield bearing stablecoin!',
  2: 'Correct!',
  3: 'Incorrect. sDOLA is Inverse’s yield bearing stablecoin!',
};

export default async function getResponse(req, res) {
  const data = req.body;
  const buttonId = data?.untrustedData?.buttonIndex;
  const fid = data?.untrustedData?.fid;
  const url = data?.untrustedData?.url;

  if(!fid || !options[buttonId]) {
    res.status(200).send(getErrorFrame(url));
  }

  return res.status(200).send(`<!DOCTYPE html><html><head>
    <title>Question 1: sDOLA is a:</title>
    <meta property="og:title" content="Question 1: sDOLA is a:" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="https://inverse.finance/assets/sDOLAx512.png" />
    <meta property="og:image" content="https://inverse.finance/assets/sDOLAx512.png" />    
    <meta property="fc:frame:button:1" content="Next question" />
    <meta property="fc:frame:post_url" content="https://inverse.finance/frames/quizz/q2" />
  </head>
  <body>
    <p>Result: ${options[buttonId] || 'Invalid answer'}</p>
  </body>
  </html>`);

}

export async function POST(req, res) {
  return getResponse(req, res);
}