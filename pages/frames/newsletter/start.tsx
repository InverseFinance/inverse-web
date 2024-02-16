import { FRAME_BASE_URL } from '@app/util/frames';
import Head from 'next/head';

export default function Page() {
  const title = `sDOLA Quiz Bowl`;
  const image = `api/frames/newsletter/image-start?xx=9`;
  return (
    <>
      <Head>
        <title>sDOLA Quiz Bowl</title>
        <meta property="og:title" content={title} />
        <meta name="og:description" content="" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${FRAME_BASE_URL}/${image}`} />
        <meta property="og:image" content={`${FRAME_BASE_URL}/${image}`} />
        <meta property="fc:frame:input:text" content="Please enter your e-mail:" />
        <meta property="fc:frame:button:1" content="Subscribe" />
        <meta property="fc:frame:post_url" content={`${FRAME_BASE_URL}/api/frames/newsletter/submit`} />        
      </Head>
      <body>
        <p>Hello!</p>
      </body>
    </>
  );
}
