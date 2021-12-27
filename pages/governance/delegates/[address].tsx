import { useState } from 'react'
import { Box, Divider, Flex, Image, Stack, Text, useMediaQuery, VStack } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/common/Avatar'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import Container from '@inverse/components/common/Container'
import { DelegatorsPreview, VotingWallet } from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { SkeletonBlob, SkeletonTitle } from '@inverse/components/common/Skeleton'
import { useDelegates, useTopDelegates } from '@inverse/hooks/useDelegates'
import { namedAddress, shortenAddress } from '@inverse/util'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InfoMessage } from '@inverse/components/common/Messages'
import { NetworkIds } from '@inverse/types'
import { SignatureAnim } from '@inverse/components/common/Animation'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { SignDelegation } from '@inverse/components/Governance/SignDelegation';
import { useEnsProfile } from '@inverse/hooks/useEnsProfile'
import { Link } from '@inverse/components/common/Link';

const AlreadyDelegating = ({ isSelf }: { isSelf: boolean }) => (
  <Box textAlign="center">
    <InfoMessage alertProps={{ p: '9' }} description={`You're currently delegating to ${isSelf ? 'yourself' : 'this address'} ${isSelf ? '✅' : '🤝'}`} />
    <Text mt="2" textAlign="center">
      Share the link to this page if you want supporters delegating to {isSelf ? 'you' : 'this address'}
    </Text>
  </Box>
)

const SOCIALS = [
  {
    type: 'twitter',
    href: 'https://twitter.com/',
    image: '/assets/socials/twitter.svg',
  },
  {
    type: 'discord',
    href: 'https://discord.gg/',
    image: '/assets/socials/discord.svg',
  },
  {
    type: 'telegram',
    href: 'https://t.me/',
    image: '/assets/socials/telegram.svg',
  },
  {
    type: 'github',
    href: 'https://github.com/',
    image: '/assets/socials/github.svg',
  },
]

const DelegateOverview = ({ address, newlyChosenDelegate }: { address: string, newlyChosenDelegate?: string }) => {
  const { chainId, library, active, account } = useWeb3React<Web3Provider>()
  const { delegates, isLoading } = useDelegates()
  const { delegates: topDelegates } = useTopDelegates()
  const [isLargerThan780] = useMediaQuery('(min-width: 780px)')
  const { INV, XINV } = getNetworkConfigConstants(chainId)
  const { ensName, ensProfile, hasEnsProfile } = useEnsProfile(address)

  const { data } = useEtherSWR([
    [INV, 'delegates', account],
    [XINV, 'delegates', account],
  ])

  if (!data) { return <></> }

  const [invDelegate, xinvDelegate] = data;
  const isAlreadySameDelegate = (newlyChosenDelegate || data[0]) === address && invDelegate === xinvDelegate;

  const isSelf = account === address;

  const delegate = delegates && delegates[address] || { address, votingPower: 0, votes: [], delegators: [], ensName: '' }

  if (!address || isLoading || !delegate) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const rank = (topDelegates.findIndex((topDelegate) => address === topDelegate.address) + 1) || ''

  const signDisabled = !active || chainId?.toString() !== NetworkIds.mainnet;

  const delegationCase = (isAlreadySameDelegate ? 'alreadyDelegating' : 'changingDelegation');

  const delegationCases = {
    changingDelegation: <SignDelegation signDisabled={signDisabled} signer={library?.getSigner()} delegateAddress={address} isSelf={isSelf} />,
    alreadyDelegating: <AlreadyDelegating isSelf={isSelf} />, // already delegating to self or other
  }

  return (
    <Container
      label={namedAddress(address, chainId, ensName)}
      description={isLargerThan780 ? address : shortenAddress(address)}
      href={`https://etherscan.io/address/${address}`}
      image={<Avatar sizePx={50} address={address} />}
      right={rank && <Text fontWeight="medium" fontSize="sm" color="purple.200">{`Rank ${rank}`}</Text>}
    >
      <Box w="full">
        <Flex alignItems="center">
          <SignatureAnim height={40} width={40} loop={true} />
          <Text ml="3" display="inline-block" fontSize="20" fontWeight="bold">
            {isSelf ? 'Self-' : ''}Delegation
          </Text>
        </Flex>

        <Divider mt="3" mb="5" />
        {hasEnsProfile && <VStack spacing="5" mb="5">
          {ensProfile?.description && <i>&laquo; {ensProfile.description.replace(/"/g, '')} &raquo;</i>}
          {
            (ensProfile?.discord || ensProfile?.twitter || ensProfile?.github)
            && <Stack direction="row" spacing={5} align="center">
              {SOCIALS
                .filter(({ type }) => !!ensProfile[type])
                .map(({ href, image, type }, i) => (
                  <Link isExternal key={i} href={`${ensProfile[type]?.includes('http') ? '' : href}${ensProfile[type]}`}>
                    <Image src={image} />
                  </Link>
                ))}
            </Stack>
          }
        </VStack>}
        {delegationCases[delegationCase]}

      </Box>
    </Container>
  )
}

export const DelegateView = () => {
  const [newlyChosenDelegate, setNewlyChosenDelegate] = useState('');
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
          { label: title, href: `/governance/delegates/${address}` },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
            <DelegateOverview address={address} newlyChosenDelegate={newlyChosenDelegate} />
          </Flex>
        </Flex>
        <Flex direction="column">
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <VotingWallet address={address} onNewDelegate={(newDelegate) => setNewlyChosenDelegate(newDelegate)} />
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
