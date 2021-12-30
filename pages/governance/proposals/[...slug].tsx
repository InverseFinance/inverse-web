import { Flex, Text } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import {
  AgainstVotes,
  ForVotes,
  ProposalActions,
  ProposalDetails,
  VoteButton,
  VotingWallet,
} from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { useRouter } from 'next/dist/client/router'
import { Proposal, GovEra } from '@inverse/types';
import { useProposals } from '@inverse/hooks/useProposals';
import Head from 'next/head'
import { InfoMessage } from '@inverse/components/common/Messages'

const fixEraTypo = (era: string): GovEra => era.replace('mils', GovEra.mills) as GovEra;

// TODO: use SSG
// urls can be /governance/proposals/<numProposal> or /governance/proposals/<era>/<proposalId>
export const Governance = () => {
  const { asPath } = useRouter();
  const slug = asPath.replace('/governance/proposals/', '').replace(/\?.*$/, '').split('/');
  const { proposals, isLoading } = useProposals();

  const proposal = proposals?.map(p => ({ ...p, era: fixEraTypo(p.era) }))
    .find((p: Proposal) => {
      return slug.length === 1 ?
        p.proposalNum.toString() === slug[0] :
        p.era === fixEraTypo(slug[0]) && p.id.toString() === slug[1]
    }) || {} as Proposal;

  const { id = '', era = '' } = proposal;

  const notFound = !isLoading && !id;
  const proposalBreadLabel = !notFound ? `#${id.toString().padStart(3, '0')} of ${era.toUpperCase()} Era` : slug.join('/');

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Proposal Details</title>
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
              </Flex>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VoteButton proposal={proposal} />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VotingWallet />
                </Flex>
                <Flex w={{ base: 'full', xl: 'sm'}} justify="center">
                  <Flex w="full" m={6} mb={0} mt="14">
                    <InfoMessage alertProps={{ fontSize: '12px', w: 'full' }} description="Governance data is updated every 15 min" />
                  </Flex>
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
