import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { StabilizerOverview, StabilizerView } from '@inverse/components/Stabilizer'

export const Stabilizer = () => (
  <Layout>
    <AppNav active="Stabilizer" />
    <Flex justify="center" direction="column">
      <Flex w={{ base: 'full', xl: 'xl' }}>
        <StabilizerView />
      </Flex>
      <Flex w={{ base: 'full', xl: 'xl' }}>
        <StabilizerOverview />
      </Flex>
    </Flex>
  </Layout>
)

export default Stabilizer
