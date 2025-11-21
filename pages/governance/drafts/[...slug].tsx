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
import Head from 'next/head'
import { archiveDraft, getProposalActionFromFunction, updateReadGovernanceNotifs } from '@app/util/governance'
import { useEffect } from 'react';
import { ProofOfReviews } from '@app/components/Governance/ProofOfReviews'
import { getRedisClient } from '@app/util/redis'
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { useWeb3React } from '@app/util/wallet'
import { Web3Provider } from '@ethersproject/providers'
import { showToast } from '@app/util/notify'
import { DRAFT_WHITELIST } from '@app/config/constants'

export const Drafts = ({ proposal }) => {
  const router = useRouter();
  const { asPath, isFallback } = router
  const { provider, account } = useWeb3React<Web3Provider>()

  const slug = asPath.replace('/governance/drafts/', '').replace(/\?.*$/, '').split('/');

  const { id = '', era = '' } = proposal || {};

  const notFound = !id && !isFallback;
  const proposalBreadLabel = !notFound ? `#${id.toString().padStart(3, '0')} of ${era.toUpperCase()} Era` : slug.join('/');

  useEffect(() => {
    if (!proposal?.id) { return }
    updateReadGovernanceNotifs(`draft-${proposal.id}`);
  }, [proposal?.id]);

  const handleArchiveDraft = async () => {
    if (!provider?.getSigner()) {
      showToast({ description: 'Not connected', status: 'info' });
      return;
    }
    return archiveDraft(proposal?.id, provider.getSigner(), !proposal.isArchived, () => location.href = !proposal.isArchived ? `/governance/archived-drafts` : `/governance`);
  }

  const canDraft = DRAFT_WHITELIST.includes((account || '')?.toLowerCase());

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Draft Details</title>
        <meta name="og:title" content={`Inverse Finance - Draft Proposal`} />
        <meta name="og:description" content={`${proposal?.title || 'Draft'}`} />
        <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=600&q=80" />
        <meta name="description" content={`Inverse Finance DAO's Draft Proposal`} />
        <meta name="keywords" content={`Inverse Finance, DAO, governance, proposal, draft`} />
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
          notFound || isFallback ? <Flex w="full" justifyContent="center" pt="50">
            <Text fontSize="xl">{
              isFallback ? 'Loading...' : 'Draft not found or removed'
            }
            </Text>
          </Flex>
            :
            <>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalDetails proposal={proposal} isPublicDraft={true} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalActions proposal={{
                    _id: proposal.id,
                    title: proposal.title,
                    description: proposal.description,
                    functions: proposal?.functions,
                    actions: proposal?.functions.map((f, i) => getProposalActionFromFunction(i + 1, f)),
                  }} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  {!!id && <ProofOfReviews id={id} isDraft={true} />}
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} mt="10" justify="center">
                  {
                    !notFound && canDraft && <RSubmitButton fontSize="14px" themeColor="orange.500" w='fit-content' onClick={handleArchiveDraft}>
                      {proposal.isArchived ? 'Unarchive Draft' : 'Archive Draft'}
                    </RSubmitButton>
                  }
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

// static with 1 sec revalidation
export async function getStaticProps(context) {
  const { slug } = context.params;
  const client = getRedisClient();
  const drafts = JSON.parse(await client.get('drafts') || '[]');

  const now = new Date();

  const previews: Partial<Proposal>[] = drafts.map(d => {
    return {
      id: d.publicDraftId,
      title: d.title,
      description: d.description,
      functions: d.functions,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt || '',
      proposer: d.createdBy || '',
      era: GovEra.mills,
      startTimestamp: Date.now(),
      endTimestamp: (new Date()).setDate(now.getDate() + 3),
      status: ProposalStatus.draft,
      isArchived: !!d.isArchived,
    }
  })

  const proposal = previews?.find((p: Proposal) => {
    return slug.length === 1 ?
      p.id?.toString() === slug[0] :
      p.era === slug[0] && p.id?.toString() === slug[1]
  }) || {} as Proposal;

  return {
    props: { proposal },
    revalidate: 2,
  }
}

export async function getStaticPaths() {
  if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
    return { paths: [], fallback: true }
  }
  const client = getRedisClient();
  const drafts = JSON.parse(await client.get('drafts') || '[]');

  const possiblePaths = drafts.map(p => {
    return `/governance/drafts/${p.era}/${p.id}`;
  });

  return {
    paths: possiblePaths,
    fallback: true,
  }
}