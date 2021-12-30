import { Flex } from '@chakra-ui/react'
import {
  ActiveProposals,
  Breakdown,
  DelegatesPreview,
  LocalDraftProposals,
  RecentProposals,
  VotingWallet,
} from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { Link } from '@inverse/components/common/Link'
import Head from 'next/head'
import { useDraftProposals } from '@inverse/hooks/useProposals'
import { InfoMessage } from '@inverse/components/common/Messages'

export const Governance = () => {
  const { drafts } = useDraftProposals()
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Governance</title>
      </Head>
      <AppNav active="Governance" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          {
            drafts?.length && <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
              <LocalDraftProposals drafts={drafts} />
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
}

export default Governance
