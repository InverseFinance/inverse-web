import { useState } from 'react'
import { Box, Divider, Flex, Image, Stack, Text, useMediaQuery, VStack } from '@chakra-ui/react'
import { Avatar } from '@app/components/common/Avatar'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import Container from '@app/components/common/Container'
import { DelegatorsPreview, VotingWallet } from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { SkeletonBlob, SkeletonTitle } from '@app/components/common/Skeleton'
import { useDelegates, useTopDelegates } from '@app/hooks/useDelegates'
import { namedAddress, shortenAddress } from '@app/util'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InfoMessage } from '@app/components/common/Messages'
import { NetworkIds } from '@app/types'
import { SignatureAnim } from '@app/components/common/Animation'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks'
import { SignDelegation } from '@app/components/Governance/SignDelegation';
import { useEnsProfile } from '@app/hooks/useEnsProfile'
import { Link } from '@app/components/common/Link';
import Head from 'next/head'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'

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
      right={rank && <Text fontWeight="medium" fontSize="sm" color="secondaryTextColor">{`Rank ${rank}`}</Text>}
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
          {ensProfile?.description && <i>&laquo; {ensProfile.description.replace(/"/g, '')} &raquo; - {ensName}</i>}
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
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Delegate Page</title>
      </Head>
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
            <Flex w="full" m={6} mb={0} mt="14">
              <GovernanceInfos />
            </Flex>
          </Flex>
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
