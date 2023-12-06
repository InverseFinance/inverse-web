import { Flex} from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';

export const Analytics = () => {
  return (
    <Layout bg="#100e21" bgColor="#100e21">
      <Head>
        <title>Inverse Finance - Analytics</title>
        <meta name="og:title" content="Inverse Finance - Analytics" />
        <meta name="og:description" content="Detailed Analytics" />
        <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/2tCFzmEbLPvp0FfONQnKKw/9eacce843bf6c3edf18dd06c4eb892ac/Inverse_Analytics.png?w=3840&q=75" />
        <meta name="description" content="Inverse Finance Analytics" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, analytics, dune" />
      </Head>
      <AppNav active="Analytics" />
      <Flex direction="column" w={{ base: 'full' }} p="0" m="0">
        <iframe width="100%" height="900px" src="https://datastudio.google.com/embed/reporting/cb58a483-78a0-4f08-9625-25ea42a2bd12/page/Iz7jC"></iframe>
      </Flex>
    </Layout>
  )
}

export default Analytics
