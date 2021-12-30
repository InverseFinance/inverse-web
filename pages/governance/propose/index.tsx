import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import { Breakdown, DelegatesPreview, VotingWallet } from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { useWeb3React } from '@web3-react/core';
import { getNetworkConfigConstants } from '@inverse/config/networks'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { formatUnits } from 'ethers/lib/utils';
import { Web3Provider } from '@ethersproject/providers';
import { ProposalFormContainer } from '@inverse/components/Governance/Propose/ProposalFormContainer'
import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
import { InfoMessage } from '@inverse/components/common/Messages'

export const Propose = () => {
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

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - New Proposal</title>
      </Head>
      <AppNav active="Propose" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Propose', href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <ProposalFormContainer votingPower={votingPower} />
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

export default Propose
