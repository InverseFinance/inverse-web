import { Flex } from '@chakra-ui/react'
import {
  ActiveProposals,
  Breakdown,
  DelegatesPreview,
  LocalDraftProposals,
  PublicDraftProposals,
  RecentProposals,
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
      </Head>
      <AppNav active="Governance" />
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
            <Link fontSize="12" mt="2" href={`/governance/propose`}>Submit a new Proposal</Link>
          </Flex>
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <RecentProposals />
          </Flex>
        </Flex>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <VotingWallet />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <Flex w="full" m={6} mb={0} mt="14">
              <GovernanceInfos />
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
}

export default Governance
