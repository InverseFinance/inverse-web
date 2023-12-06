import { Flex } from '@chakra-ui/react'
import Layout from 'blog/components/layout'
import Head from 'next/head';
import { Newsletter } from '@app/components/common/Newsletter';

export const NewsletterPage = () => {

  return (
    <Layout preview={false} isNewsletter={true}>
      <Head>
        <title>Inverse Finance - Newsletter</title>
        <meta name="og:title" content="Inverse Finance - Newsletter" />
        <meta name="description" content="Inverse Finance Newsletter" />
        <meta name="og:description" content="Inverse Finance Newsletter" />
        <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/7pSjnOVQJfwsIgGljrntqm/177006643eedab87cc9b3557ea62d315/Newsletter_Backlog_op4.png?w=3840&q=75" />
        <meta name="keywords" content="Inverse Finance, inv, token, newsletter, dola, defi" />
      </Head>
      <Flex direction="column" w={{ base: 'full' }} justify="center" pt="100px">
        <Newsletter />
      </Flex>
    </Layout>
  )
}

export default NewsletterPage