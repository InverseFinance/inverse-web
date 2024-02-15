import Head from 'next/head';

export default function Page() {  
  return (
    <>
      <Head>        
        <title>sDOLA Quiz Bowl</title>
        <meta property="og:title" content="sDOLA Quiz Bowl" />
        <meta name="og:description" content="" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://inverse.finance/assets/sDOLAx512.png" />
        <meta property="og:image" content="https://inverse.finance/assets/sDOLAx512.png" />
        <meta property="fc:frame:button:1" content="GO" />                
        <meta property="fc:frame:post_url" content="https://inverse.finance/frames/quizz/q1" />        
      </Head>
      <body>
        <p>Hello!</p>
      </body>
    </>
  );
}
