import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { GuardView } from '@inverse/components/Guard'

export const Guard = () => (
  <Layout>
    <AppNav active="Guard" />
    <Flex justify="center" direction="column">
      <Flex w={{ base: 'full', xl: 'xl' }}>
        <GuardView />
      </Flex>
    </Flex>
  </Layout>
)

export default Guard
