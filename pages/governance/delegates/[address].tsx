import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/Breadcrumbs'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { smallAddress } from '@inverse/util'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'

export const Stake = () => {
  const { query } = useRouter()

  // @ts-ignore
  const title = isAddress(query.address) ? smallAddress(query.address) : (query.address as string)

  return (
    <Layout>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Delegates', href: '/governance/delegates' },
          { label: title, href: '#' },
        ]}
      />
      <Flex w="full" align="center" direction="column">
        <Flex w={{ base: 'full', xl: '7xl' }} align="center"></Flex>
      </Flex>
    </Layout>
  )
}

export default Stake
