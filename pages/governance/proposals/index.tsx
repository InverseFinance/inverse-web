import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import { Breakdown, DelegatesPreview, Proposals, VotingWallet } from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { InfoMessage } from '@inverse/components/common/Messages'

export const Governance = () => (
  <Layout>
    <Head>
      <title>Inverse Finance - Proposals</title>
    </Head>
    <AppNav active="Governance" />
    <Breadcrumbs
      w="7xl"
      breadcrumbs={[
        { label: 'Governance', href: '/governance' },
        { label: 'Proposals', href: '#' },
      ]}
    />
    <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
          <Proposals />
        </Flex>
      </Flex>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <VotingWallet />
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <Flex w="full" m={6} mb={0} mt="14">
            <InfoMessage alertProps={{ fontSize: '12px', w: 'full' }} description="Governance data is updated every 15 min" />
          </Flex>
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <Breakdown />
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <DelegatesPreview />
        </Flex>
      </Flex>
    </Flex>
  </Layout>
)

export default Governance
