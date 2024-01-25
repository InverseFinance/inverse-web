import { Flex } from '@chakra-ui/react'
import {
  ActiveProposals,
  Breakdown,
  DelegatesPreview,
  LocalDraftProposals,
  Proposals,
  PublicDraftProposals,
  VotingWallet,
} from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { Link } from '@app/components/common/Link'
import Head from 'next/head'
import { useLocalDraftProposals, usePublicDraftProposals } from '@app/hooks/useProposals'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'

export const Governance = () => {
  const { drafts: localDratts } = useLocalDraftProposals()
  const { drafts: publicDrafts } = usePublicDraftProposals()
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Governance</title>
        <meta name="og:title" content="Inverse Finance - Governance" />
        <meta name="og:description" content="On-Chain Governance Proposals and Off-Chain Drafts" />
        <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=600&q=80" />
        <meta name="description" content="Inverse Finance DAO's On-Chain Proposals and Off-Chain Drafts" />
        <meta name="keywords" content="Inverse Finance, dao, inv, token, proposal, draft, governance, DeFi, vote" />
      </Head>
      <AppNav active="Governance" activeSubmenu="Drafts & Proposals" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          {
            localDratts?.length > 0 && <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
              <LocalDraftProposals drafts={localDratts} />
            </Flex>
          }
          {
            publicDrafts?.length > 0 && <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
              <PublicDraftProposals drafts={publicDrafts} />
            </Flex>
          }
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <ActiveProposals />
          </Flex>
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <Link color="lightAccentTextColor" textDecoration="underline" fontSize="14" mt="2" href={`/governance/propose`}>
              Submit a new Proposal
            </Link>
          </Flex>
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <Proposals
              recentOnly={true}
              label="Recent Proposals"
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
}

export default Governance
