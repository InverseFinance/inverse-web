import Head from 'next/head';

export const JsonLd = ({ data }: { data: Record<string, any> }) => (
  <Head>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  </Head>
);
