import { FRAME_BASE_URL } from '@app/util/frames';

export const getQuizzQ1Frame = (goToNext = false) => {
  const title = `Question 1`;
  const image = goToNext ? `api/frames/quizz/images-qa?q=1&answer=correct` : `api/frames/quizz/images-qa?q=1`;

  const questionHtml = `
  <meta property="fc:frame:button:1" content="Gov token" />
  <meta property="fc:frame:button:2" content="Yield-bearing stablecoin" />
  <meta property="fc:frame:button:3" content="Italian pastry" />
  <meta property="fc:frame:post_url" content="${FRAME_BASE_URL}/api/frames/quizz/submit?q=1" />
  `;

  const answerHtml = `
  <meta property="fc:frame:button:1" content="Next question" />
  <meta property="fc:frame:post_url" content="${FRAME_BASE_URL}/api/frames/quizz/submit?q=2&ask=true" />
  `

  return `<!DOCTYPE html>
<html>

<head>
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${FRAME_BASE_URL}/${image}" />
  <meta property="og:image" content="${FRAME_BASE_URL}/${image}" />
  ${goToNext ? answerHtml : questionHtml}
</head>

<body>
  <p>${title}</p>
</body>

</html>
  `;
}