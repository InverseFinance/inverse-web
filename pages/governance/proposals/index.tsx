import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import { Breakdown, DelegatesPreview, Proposals, VotingWallet } from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'

export const Governance = () => (
  <Layout>
    <Head>
      <title>Inverse Finance - Proposals</title>
      <meta name="og:title" content="Inverse Finance - Governance" />
      <meta name="og:description" content="On-Chain Governance Proposals" />
      <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=3840&q=75" />
      <meta name="description" content="Inverse Finance DAO's On-Chain Proposals" />
      <meta name="keywords" content="Inverse Finance, dao, inv, token, proposal, governance, DeFi, vote" />
    </Head>
    <AppNav active="Governance" activeSubmenu="Passed Proposals" />
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
          <Proposals
            label="Governance Proposals"
            description="Participate in governance of the DAO"
            href="https://docs.inverse.finance/inverse-finance/inverse-finance/introduction/governance"
          />
        </Flex>
      </Flex>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <Flex w="full" m={6} mb={0} mt="14">
            <GovernanceInfos />
          </Flex>
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <VotingWallet />
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
