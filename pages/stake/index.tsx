import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { StakeView } from '@inverse/components/Stake'

export const Stake = () => (
  <Layout>
    <AppNav active="Stake" />
    <Flex justify="center" direction="column">
      <Flex w={{ base: 'full', xl: 'xl' }}>
        <StakeView />
      </Flex>
    </Flex>
  </Layout>
)

export default Stake
