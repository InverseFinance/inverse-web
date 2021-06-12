import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'

export const Landing = () => (
  <Layout>
    <AppNav active="Vaults" />
    <Flex></Flex>
  </Layout>
)

export default Landing
