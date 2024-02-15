import { getCacheFromRedisAsObj, redisSetWithTimestamp } from "@app/util/redis";

export const setFrameCheckAction = async (frameId, step, value, fid) => {
    const key = `frames:${frameId}-${step}-fid${fid}`;
    const { data } = (await getCacheFromRedisAsObj(key)) || {};
    if (!!data) {
        return { alreadyUsed: true };
    } else {
        await redisSetWithTimestamp(key, { value });
    }
}

export const getErrorFrame = (url: string) => {
    return `<!DOCTYPE html><html><head>
    <title>Invalid request</title>
    <meta property="og:title" content="Invalid request:" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="https://inverse.finance/assets/inverse-logo-banner.png" />
    <meta property="og:image" content="https://inverse.finance/assets/inverse-logo-banner.png" />    
    <meta property="fc:frame:button:1" content="Go back" />
    <meta property="fc:frame:post_url" content="${url}" />
  </head>
  <body>
    <p>Invalid request</p>
  </body>
  </html>`
}