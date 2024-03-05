import { FRAME_BASE_URL } from '@app/util/frames';

export const getQuizzQ3Frame = (goToNext = false) => {
  const title = `Question 3`;
  const image = goToNext ? `api/frames/quizz/images-qa?q=3&answer=correct` : `api/frames/quizz/images-qa?q=3`;

  const questionHtml = `
  <meta property="fc:frame:button:1" content="Correct" />
  <meta property="fc:frame:button:2" content="Incorrect" />
  <meta property="fc:frame:button:3" content="Incorrect" />
  <meta property="fc:frame:post_url" content="${FRAME_BASE_URL}/api/frames/quizz/submit?q=3" />
  `;

  const answerHtml = `
  <meta property="fc:frame:button:1" content="Finish" />
  <meta property="fc:frame:post_url" content="${FRAME_BASE_URL}/api/frames/quizz/submit?q=3&end=true" />
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
  
  </html>`
}