import { Flex } from '@chakra-ui/react'
import {
  Breakdown,
  DelegatesPreview,
  PublicDraftProposals,
  VotingWallet,
} from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePublicDraftProposals } from '@app/hooks/useProposals'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'

export const Governance = () => {
  const { drafts: archivedDrafts } = usePublicDraftProposals(true)
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Archived Drafts</title>
        <meta name="og:title" content="Inverse Finance - Archived Drafts" />
        <meta name="og:description" content="Inverse Finance DAO's Archived Drafts" />
        <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=600&q=80" />
        <meta name="description" content="Inverse Finance DAO's Archived Drafts" />
        <meta name="keywords" content="Inverse Finance, dao, inv, token, proposal, draft, governance, DeFi, vote" />
      </Head>
      <AppNav active="Governance" activeSubmenu="Archived Drafts" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          {
            archivedDrafts?.length > 0 && <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
              <PublicDraftProposals isArchived={true} drafts={archivedDrafts} />
            </Flex>
          }
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
}

export default Governance
