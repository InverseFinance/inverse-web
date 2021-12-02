import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { SwapView } from '@inverse/components/Swap'

export const Swap = () => {
  return (
    <Layout>
      <AppNav active="Swap" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: 'xl' }}>
          <SwapView />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Swap
