import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { StabilizerOverview } from '@inverse/components/Stabilizer';
import { SwapView } from '@inverse/components/Swap'
import { useRouter } from 'next/dist/client/router';

export const Swap = () => {
  const { query, isReady } = useRouter()
  return (
    <Layout>
      <AppNav active="Swap" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: 'xl' }}>
          {
            isReady ? <SwapView from={query?.from as string} to={query?.to as string} /> : null
          }
        </Flex>
        <Flex w={{ base: 'full', lg: '600px' }}>
          <StabilizerOverview />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Swap
