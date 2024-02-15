import { getErrorFrame } from "@app/util/frames";

const options = {
  1: 'Incorrect. sDOLA derives its yield from FiRM fixed rate lending market revenues!',
  2: 'Correct!',
  3: 'Incorrect. sDOLA derives its yield from FiRM fixed rate lending market revenues!',
};

export default async function handler(req, res) {
  const data = req.body;
  const buttonId = data?.untrustedData?.buttonIndex;
  const fid = data?.untrustedData?.fid;
  const url = data?.untrustedData?.url;

  if (!fid || !options[buttonId]) {
    return res.status(200).send(getErrorFrame(url));
  }

  return res.status(200).send(`<!DOCTYPE html><html><head>
    <title>Question 2: sDOLA derives its yield from</title>
    <meta property="og:title" content="Question 2: sDOLA derives its yield from" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="https://inverse.finance/assets/sDOLAx512.png" />
    <meta property="og:image" content="https://inverse.finance/assets/sDOLAx512.png" />    
    <meta property="fc:frame:button:1" content="See score" />
    <meta property="fc:frame:post_url" content="https://inverse.finance/frames/quizz/end" />
  </head>
  <body>
    <p>Result: ${options[buttonId] || 'Invalid answer'}</p>
  </body>
  </html>`);
}