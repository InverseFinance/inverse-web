import { Flex, Text } from '@chakra-ui/react'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import {
  VotingWallet,
} from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { useRouter } from 'next/dist/client/router'
import { Proposal, GovEra, ProposalStatus } from '@app/types';
import { usePublicDraftProposals } from '@app/hooks/useProposals';
import Head from 'next/head'
import { ProposalFormContainer } from '@app/components/Governance/Propose/ProposalFormContainer'
import { useWeb3React } from '@web3-react/core';
import { getNetworkConfigConstants } from '@app/util/networks';
import useEtherSWR from '@app/hooks/useEtherSWR'
import { formatUnits } from 'ethers/lib/utils';
import { Web3Provider } from '@ethersproject/providers';

export const Drafts = () => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = query?.viewAddress || account
  const { INV, XINV } = getNetworkConfigConstants(chainId)
  const { data } = useEtherSWR([
    [XINV, 'exchangeRateStored'],
    [INV, 'getCurrentVotes', userAddress],
    [XINV, 'getCurrentVotes', userAddress],
  ])

  const [exchangeRate, currentVotes, currentVotesX] = data || [1, 0, 0];
  const votingPower = parseFloat(formatUnits(currentVotes || 0)) +
    parseFloat(formatUnits(currentVotesX || 0)) * parseFloat(formatUnits(exchangeRate || '1'));

  const { asPath } = useRouter();
  const slug = asPath.replace('/governance/drafts/edit/', '').replace(/\?.*$/, '').split('/');
  const { drafts, isLoading } = usePublicDraftProposals();

  const now = new Date();

  const previews: Partial<Proposal>[] = drafts.map(d => {
    return {
      id: d.publicDraftId,
      title: d.title,
      description: d.description,
      functions: d.functions,
      proposer: '',
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

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Edit Draft</title>
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
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
                  <ProposalFormContainer publicDraft={proposal} votingPower={votingPower} />
                </Flex>
              </Flex>
              <Flex direction="column">
                <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
                  <VotingWallet />
                </Flex>
              </Flex>
            </Flex>
        }
      </Flex>
    </Layout>
  )
}

export default Drafts
