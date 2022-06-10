import { Flex } from '@chakra-ui/react'
import Layout from 'blog/components/layout'
import Head from 'next/head';
import { Newsletter } from '@app/components/common/Newsletter';

export const NewsletterPage = () => {

  return (
    <Layout preview={false} isNewsletter={true}>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Newsletter</title>
        <meta name="og:title" content="Inverse Finance - Newsletter" />
        <meta name="description" content="Inverse Finance Newsletter" />
        <meta name="keywords" content="Inverse Finance, inv, token, newsletter, dola, defi" />
      </Head>
      <Flex direction="column" w={{ base: 'full' }} justify="center" pt="100px">
        <Newsletter />
      </Flex>
    </Layout>
  )
}

export default NewsletterPage