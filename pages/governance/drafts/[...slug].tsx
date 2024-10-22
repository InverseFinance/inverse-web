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
import { updateReadGovernanceNotifs } from '@app/util/governance'
import { useEffect } from 'react';
import { ProofOfReviews } from '@app/components/Governance/ProofOfReviews'
import { getRedisClient } from '@app/util/redis'

export const Drafts = ({ proposal }) => {
  const { asPath, isFallback } = useRouter();

  const slug = asPath.replace('/governance/drafts/', '').replace(/\?.*$/, '').split('/');

  const { id = '', era = '' } = proposal || {};

  const notFound = !id && !isFallback;
  const proposalBreadLabel = !notFound ? `#${id.toString().padStart(3, '0')} of ${era.toUpperCase()} Era` : slug.join('/');

  useEffect(() => {
    if (!proposal?.id) { return }
    updateReadGovernanceNotifs(`draft-${proposal.id}`);
  }, [proposal?.id]);

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
                  <ProposalActions proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  {!!id && <ProofOfReviews id={id} isDraft={true} />}
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
// export async function getStaticProps(context) {
//   const { slug } = context.params;
//   const client = getRedisClient();
//   const drafts = JSON.parse(await client.get('drafts') || '[]');

//   const now = new Date();

//   const previews: Partial<Proposal>[] = drafts.map(d => {
//     return {
//       id: d.publicDraftId,
//       title: d.title,
//       description: d.description,
//       functions: d.functions,
//       createdAt: d.createdAt,
//       updatedAt: d.updatedAt || '',
//       proposer: d.createdBy || '',
//       era: GovEra.mills,
//       startTimestamp: Date.now(),
//       endTimestamp: (new Date()).setDate(now.getDate() + 3),
//       status: ProposalStatus.draft,
//     }
//   })

//   const proposal = previews?.find((p: Proposal) => {
//     return slug.length === 1 ?
//       p.id?.toString() === slug[0] :
//       p.era === slug[0] && p.id?.toString() === slug[1]
//   }) || {} as Proposal;

//   return {
//     props: { proposal },
//     revalidate: 1,
//   }
// }

// export async function getStaticPaths() {
//   if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
//     return { paths: [], fallback: true }
//   }
//   const client = getRedisClient();
//   const drafts = JSON.parse(await client.get('drafts') || '[]');

//   const possiblePaths = drafts.map(p => {
//     return `/governance/drafts/${p.era}/${p.id}`;
//   });

//   return {
//     paths: possiblePaths,
//     fallback: true,
//   }
// }