import { FRAME_BASE_URL } from '@app/util/frames';

export const getQuizzQ2Frame = (answer?: string) => {
  const title = `Question 2: sDOLA derives its yield from:`;
  const image = `assets/sDOLAx512.png`;

  const questionHtml = `
  <meta property="fc:frame:button:1" content="Loans to Janet Yellen" />
  <meta property="fc:frame:button:2" content="FiRM fixed rate lending market revenues" />
  <meta property="fc:frame:button:3" content="Loans to futures traders" />
  <meta property="fc:frame:post_url" content="${FRAME_BASE_URL}/api/frames/quizz/q2" />
  `;

  const answerHtml = `
  <meta property="fc:frame:button:1" content="Restart" />
  <meta property="fc:frame:post_url" content="${FRAME_BASE_URL}/api/frames/quizz/q1?ask=true" />
  `

  return `<!DOCTYPE html>
  <html>
  
  <head>
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${FRAME_BASE_URL}/${image}" />
    <meta property="og:image" content="${FRAME_BASE_URL}/${image}" />    
    ${answer ? answerHtml : questionHtml}
  </head>
    
  <body>
    <p>${answer ? 'Result: ' + answer : 'Hi'}</p>
  </body>
  
  </html>`
}