import { Flex, Text } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/common/Avatar'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import Container from '@inverse/components/common/Container'
import { DelegatorsPreview, VotingWallet } from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { SkeletonBlob, SkeletonTitle } from '@inverse/components/common/Skeleton'
import { useDelegates, useTopDelegates } from '@inverse/hooks/useDelegates'
import { namedAddress } from '@inverse/util'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

const DelegateOverview = () => {
  const { query } = useRouter()
  const { chainId } = useWeb3React<Web3Provider>()
  const { delegates, isLoading } = useDelegates()
  const { delegates: topDelegates } = useTopDelegates()

  const address = query.address as string
  if (!address || isLoading || !delegates || !delegates[address]) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const { ensName } = delegates[address]
  const rank = topDelegates.findIndex((topDelegate) => address === topDelegate.address) + 1

  return (
    <Container
      label={namedAddress(address, chainId, ensName)}
      description={address}
      href={`https://etherscan.io/address/${address}`}
      image={<Avatar boxSize={12} address={address} />}
      right={rank && <Text fontWeight="medium" fontSize="sm" color="purple.200">{`Rank ${rank}`}</Text>}
    >
      <Text color="purple.200" fontSize="sm">
        Coming soon...
      </Text>
    </Container>
  )
}

export const DelegateView = () => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()

  const address = query.address as string
  const title = isAddress(address) ? namedAddress(address, chainId) : address

  return (
    <Layout>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Delegates', href: '/governance/delegates' },
          { label: title, href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <DelegateOverview />
          </Flex>
        </Flex>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <VotingWallet address={address} />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <DelegatorsPreview address={address} />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default DelegateView
