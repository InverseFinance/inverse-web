import { Flex} from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';

export const Analytics = () => {
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Analytics</title>
      </Head>
      <AppNav active="INV" />
      <Flex direction="column" w={{ base: 'full' }} p="5">
        <iframe width="100%" height="900px" src="https://datastudio.google.com/embed/reporting/cb58a483-78a0-4f08-9625-25ea42a2bd12/page/Iz7jC"></iframe>
      </Flex>
    </Layout>
  )
}

export default Analytics
