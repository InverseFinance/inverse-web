import { Flex} from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';

export const Analytics = () => {
  return (
    <Layout bg="#100e21" bgColor="#100e21">
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Analytics</title>
      </Head>
      <AppNav active="Transparency" activeSubmenu="Analytics"/>
      <TransparencyTabs active="analytics" />
      <Flex direction="column" w={{ base: 'full' }} p="0" m="0">
        <iframe width="100%" height="900px" src="https://datastudio.google.com/embed/reporting/cb58a483-78a0-4f08-9625-25ea42a2bd12/page/Iz7jC"></iframe>
      </Flex>
    </Layout>
  )
}

export default Analytics
