import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>        
        <title>Question 1: sDOLA is a:</title>
        <meta property="og:title" content="Question 1: sDOLA is a:" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://inverse.finance/assets/sDOLAx512.png" />
        <meta property="og:image" content="https://inverse.finance/assets/sDOLAx512.png" />
        <meta property="fc:frame:button:1" content="Gov token" />
        <meta property="fc:frame:button:2" content="Yield-bearing stablecoin" />        
        <meta property="fc:frame:button:3" content="Italian pastry" />
        <meta property="fc:frame:post_url" content={`https://inverse.finance/api/frames/quizz/q1`} />
      </Head>      
    </>
  );
}
