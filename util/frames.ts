export const FRAME_BASE_URL = process.env.VERCEL_ENV === 'production' ? 'https://inverse.finance' : !process.env.VERCEL_URL ? 'http://localhost:3000' : `https://${process.env.VERCEL_URL}`;

export const getErrorFrame = (url: string) => {
    return `<!DOCTYPE html><html><head>
    <title>Invalid request</title>
    <meta property="og:title" content="Invalid request:" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${FRAME_BASE_URL}/assets/inverse-logo-banner.png" />
    <meta property="og:image" content="${FRAME_BASE_URL}/assets/inverse-logo-banner.png" />    
    <meta property="fc:frame:button:1" content="Go back" />
    <meta property="fc:frame:post_url" content="${url}" />
  </head>
  <body>
    <p>Invalid request</p>
  </body>
  </html>`
}