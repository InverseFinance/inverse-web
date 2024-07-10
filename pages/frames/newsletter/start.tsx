import { FRAME_BASE_URL } from '@app/util/frames';
import Head from 'next/head';

export default function Page() {
  const title = `Newsletter`;
  const image = `api/frames/newsletter/image-start`;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta name="og:description" content="" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${FRAME_BASE_URL}/${image}`} />
        <meta property="og:image" content={`${FRAME_BASE_URL}/${image}`} />
        <meta property="fc:frame:button:1" content="Let me in!" />
        <meta property="fc:frame:post_url" content={`${FRAME_BASE_URL}/api/frames/newsletter/submit`} />
      </Head>
      <body>
        <p>{title} Frame</p>
      </body>
    </>
  );
}
