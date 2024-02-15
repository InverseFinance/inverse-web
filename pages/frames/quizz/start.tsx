import Head from 'next/head';

export default function Page() {  
  return (
    <>
      <Head>        
        <title>sDOLA Quiz Bowl</title>
        <meta property="og:title" content="sDOLA Quiz Bowl" />
        <meta name="og:description" content="" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="http://localhost:3000/assets/sDOLAx512.png" />
        <meta property="og:image" content="http://localhost:3000/assets/sDOLAx512.png" />
        <meta property="fc:frame:button:1" content="GO" />                
        <meta property="fc:frame:post_url" content="http://localhost:3000/frames/quizz/q1" />        
      </Head>
      <body>
        <p>Hello!</p>
      </body>
    </>
  );
}
