import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import { Breakdown, DelegatesPreview, VotingWallet } from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { useWeb3React } from '@app/util/wallet';
import { getNetworkConfigConstants } from '@app/util/networks'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { formatUnits } from 'ethers/lib/utils';
import { Web3Provider } from '@ethersproject/providers';
import { ProposalFormContainer } from '@app/components/Governance/Propose/ProposalFormContainer'
import { useRouter } from 'next/dist/client/router'
import Head from 'next/head'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'

export const Propose = () => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = query?.viewAddress || account
  const { INV, XINV, GOVERNANCE } = getNetworkConfigConstants(chainId)
  const { data } = useEtherSWR([
    [XINV, 'exchangeRateStored'],
    [INV, 'getCurrentVotes', userAddress],
    [XINV, 'getCurrentVotes', userAddress],
    [GOVERNANCE, 'proposerWhitelist', userAddress],
  ])

  const [exchangeRate, currentVotes, currentVotesX, isWhitelisted] = data || [1, 0, 0, false];
  const votingPower = parseFloat(formatUnits(currentVotes || 0)) +
    parseFloat(formatUnits(currentVotesX || 0)) * parseFloat(formatUnits(exchangeRate || '1'));

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - New Proposal</title>
      </Head>
      <AppNav active="Governance" activeSubmenu="Create a Draft" />
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
            <ProposalFormContainer isWhitelisted={isWhitelisted} votingPower={votingPower} />
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

export default Propose
