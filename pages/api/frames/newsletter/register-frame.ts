import { FRAME_BASE_URL } from '@app/util/frames';

export const getNewsletterRegisterFrame = () => {
  const title = ``;
  const image = `api/frames/newsletter/image-register?v=2`;
  return `<!DOCTYPE html>
<html>

<head>
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${FRAME_BASE_URL}/${image}" />
  <meta property="fc:frame:input:text" content="Please enter your e-mail:" />
  <meta property="fc:frame:button:1" content="Subscribe" />
  <meta property="fc:frame:post_url" content="${FRAME_BASE_URL}/api/frames/newsletter/submit" />
  <meta property="og:image" content="${FRAME_BASE_URL}/${image}" />

</head>

</html>
  `;
}