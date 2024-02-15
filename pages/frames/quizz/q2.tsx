import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>        
        <title>Question 2: sDOLA derives its yield from</title>
        <meta property="og:title" content="Question 2: sDOLA derives its yield from" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://inverse.finance/assets/sDOLAx512.png" />
        <meta property="og:image" content="https://inverse.finance/assets/sDOLAx512.png" />
        <meta property="fc:frame:button:1" content="Loans to Janet Yellen" />
        <meta property="fc:frame:button:2" content="FiRM fixed rate lending market revenues" />        
        <meta property="fc:frame:button:3" content="Loans to futures traders" />
        <meta property="fc:frame:post_url" content={`https://inverse.finance/api/frames/quizz/q2`} />
      </Head>      
    </>
  );
}
