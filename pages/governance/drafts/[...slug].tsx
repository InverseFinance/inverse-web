import { Flex, Text } from '@chakra-ui/react'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import {
  ProposalActions,
  ProposalDetails,
  VotingWallet,
} from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { useRouter } from 'next/dist/client/router'
import { Proposal, GovEra, ProposalStatus } from '@app/types';
import { usePublicDraftProposals } from '@app/hooks/useProposals';
import Head from 'next/head'
import { updateReadGovernanceNotifs } from '@app/util/governance'
import { useEffect } from 'react';
import { DraftReviews } from '@app/components/Governance/DraftReviews'

export const Drafts = () => {
  const { asPath } = useRouter();
  const slug = asPath.replace('/governance/drafts/', '').replace(/\?.*$/, '').split('/');
  const { drafts, isLoading } = usePublicDraftProposals();

  const now = new Date();

  const previews: Partial<Proposal>[] = drafts.map(d => {
    return {
      id: d.publicDraftId,
      title: d.title,
      description: d.description,
      functions: d.functions,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      proposer: d.createdBy || '',
      era: GovEra.mills,
      startTimestamp: Date.now(),
      endTimestamp: (new Date()).setDate(now.getDate() + 3),
      status: ProposalStatus.draft,
    }
  })

  const proposal = previews?.find((p: Proposal) => {
    return slug.length === 1 ?
      p.id?.toString() === slug[0] :
      p.era === slug[0] && p.id?.toString() === slug[1]
  }) || {} as Proposal;

  const { id = '', era = '' } = proposal;

  const notFound = !isLoading && !id;
  const proposalBreadLabel = !notFound ? `#${id.toString().padStart(3, '0')} of ${era.toUpperCase()} Era` : slug.join('/');

  useEffect(() => {
    if (!proposal?.id) { return }
    updateReadGovernanceNotifs(`draft-${proposal.id}`);
  }, [proposal?.id]);

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Draft Details</title>
      </Head>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: `Draft ${proposalBreadLabel}`, href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        {
          notFound ? <Flex w="full" justifyContent="center" pt="50">
            <Text fontSize="xl">Draft not found, please check the url</Text>
          </Flex>
            :
            <>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalDetails proposal={proposal} isPublicDraft={true} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalActions proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  { !!id && <DraftReviews publicDraftId={id} /> }
                </Flex>
              </Flex>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VotingWallet />
                </Flex>
              </Flex>
            </>
        }
      </Flex>
    </Layout>
  )
}

export default Drafts
