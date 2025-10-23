import { Flex, Text } from '@chakra-ui/react'
import { useEffect } from 'react'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import {
  AgainstVotes,
  ForVotes,
  ProposalActions,
  ProposalDetails,
  VoteButton,
  VotingWallet,
} from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { useRouter } from 'next/dist/client/router'
import { Proposal, GovEra, ProposalStatus } from '@app/types';
import Head from 'next/head'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'
import { updateReadGovernanceNotifs } from '@app/util/governance'
import { getCacheFromRedis, getRedisClient } from '@app/util/redis'
import { ProofOfReviews } from '@app/components/Governance/ProofOfReviews'
import { proposalsCacheKey } from '@app/pages/api/proposals'

const fixEraTypo = (era: string): GovEra => era.replace('mils', GovEra.mills) as GovEra;

// urls can be /governance/proposals/<numProposal> or /governance/proposals/<era>/<proposalId>
export const Governance = ({ proposal }: { proposal: Proposal }) => {
  const { asPath } = useRouter();
  const slug = asPath.replace('/governance/proposals/', '').replace(/\?.*$/, '').split('/');

  const { id = '', era = '' } = proposal || {};

  const notFound = !id;
  const proposalBreadLabel = !notFound ? `#${id.toString().padStart(3, '0')} of ${era.toUpperCase()} Era` : slug.join('/');

  useEffect(() => {
    if (!proposal?.proposalNum) { return }
    updateReadGovernanceNotifs(`active-${proposal.proposalNum}`);
  }, [proposal?.proposalNum]);

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Proposal Details</title>
        <meta name="og:title" content={`Inverse Finance - Proposal`} />
        <meta name="og:description" content={`${proposal?.title || 'Proposal Not Found'}`} />
        <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=600&q=80" />
        <meta name="description" content={`Inverse Finance DAO's Proposal: ${proposal?.title || 'Proposal Not Found'}`} />
        <meta name="keywords" content={`Inverse Finance, DAO, governance, proposal`} />
      </Head>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Proposals', href: '/governance/proposals' },
          { label: `Proposal ${proposalBreadLabel}`, href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        {
          notFound ? <Flex w="full" justifyContent="center" pt="50">
            <Text fontSize="xl">Proposal not found, please check the url</Text>
          </Flex>
            :
            <>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalDetails proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalActions proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProofOfReviews id={proposal.id} era={proposal.era} isDraft={false} />
                </Flex>
              </Flex>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <Flex w="full" m={6} mb={0} mt="14">
                    <GovernanceInfos proposalBlock={proposal.startBlock} />
                  </Flex>
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VoteButton proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VotingWallet />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <ForVotes proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <AgainstVotes proposal={proposal} />
                </Flex>
              </Flex>
            </>
        }
      </Flex>
    </Layout>
  )
}

export default Governance

// static with revalidate as on-chain proposal content cannot change but the status/votes can
export async function getStaticProps(context) {
  const { slug } = context.params;
  // const { proposals } = await getCacheFromRedis(proposalsCacheKey, false, 0, true) || { proposals: [] };
  const { proposals } = await fetch('https://inverse.finance/api/proposals').then(res => res.json());

  const proposal = proposals?.map(p => ({ ...p, era: fixEraTypo(p.era) }))
    .find((p: Proposal) => {
      return slug.length === 1 ?
        p.proposalNum.toString() === slug[0] :
        p.era === fixEraTypo(slug[0]) && p.id.toString() === slug[1]
    }) || {} as Proposal;

  return {
    props: { proposal: proposal },
    revalidate: [ProposalStatus.executed, ProposalStatus.expired, ProposalStatus.defeated, ProposalStatus.canceled].includes(proposal.status) ? undefined : 60,
  }
}

export async function getStaticPaths() {
  if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
    return { paths: [], fallback: true }
  }
  // const { proposals } = await getCacheFromRedis(proposalsCacheKey, false, 0, true) || { proposals: [] };
  const { proposals } = await fetch('https://inverse.finance/api/proposals').then(res => res.json());

  const possiblePaths = proposals.map(p => {
    return `/governance/proposals/${p.era}/${p.id}`;
  });

  return {
    paths: possiblePaths,
    fallback: true,
  }
}
