import { Flex} from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';

export const sDolaWhitepaper = () => {
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sDOLA whitepaper</title>
        <meta name="og:title" content="Inverse Finance - sDOLA whitepaper" />
        <meta name="og:description" content="Detailed sDOLA whitepaper" />        
        <meta name="description" content="Inverse Finance sDOLA whitepaper" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, sDOLA, whitepaper" />
      </Head>
      <AppNav active="Stake" />
      <Flex direction="column" w={{ base: 'full' }} p="0" m="0">
        <iframe width="100%" height="900px" src="/sDOLA.pdf"></iframe>
      </Flex>
    </Layout>
  )
}

export default sDolaWhitepaper
