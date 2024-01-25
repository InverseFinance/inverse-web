import { useState } from 'react'
import { Box, Divider, Flex, Image, Stack, Text, useMediaQuery, VStack } from '@chakra-ui/react'
import { Avatar } from '@app/components/common/Avatar'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import Container from '@app/components/common/Container'
import { VotingWallet } from '@app/components/Governance'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { SkeletonBlob, SkeletonTitle } from '@app/components/common/Skeleton'
import { useDelegates, useTopDelegates, useVotingPower } from '@app/hooks/useDelegates'
import { namedAddress, shortenAddress } from '@app/util'
import { isAddress } from 'ethers/lib/utils'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { InfoMessage } from '@app/components/common/Messages'
import { Delegate, NetworkIds } from '@app/types'
import { SignatureAnim } from '@app/components/common/Animation'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks'
import { SignDelegation } from '@app/components/Governance/SignDelegation';
import { useEnsProfile } from '@app/hooks/useEnsProfile'
import { Link } from '@app/components/common/Link';
import Head from 'next/head'
import { GovernanceInfos } from '@app/components/Governance/GovernanceInfos'
import { DelegatingEventsTable, PastVotesTable, SupportersTable } from '.'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup';
import { BURN_ADDRESS } from '@app/config/constants'
import { useStakedInFirm } from '@app/hooks/useFirm'

const AlreadyDelegating = ({ isSelf }: { isSelf: boolean }) => (
  <Box textAlign="left">
    <InfoMessage alertProps={{ p: '9', w: 'full' }} description={`You're currently delegating to ${isSelf ? 'yourself' : 'this address'} ${isSelf ? '✅' : '🤝'}`} />
    <Text mt="2" textAlign="left">
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

type Tabs = 'votes' | 'supporters' | 'delegations';

const DelegateOverview = ({ address, newlyChosenDelegate }: { address: string, newlyChosenDelegate?: string }) => {
  const { chainId, provider, isActive, account } = useWeb3React<Web3Provider>()
  const { query } = useRouter();
  const userAddress = (query?.viewAddress as string) || account;
  const { delegates, isLoading } = useDelegates(address)
  const { delegates: topDelegates } = useTopDelegates()
  const [isLargerThan780] = useMediaQuery('(min-width: 780px)')
  const { INV, XINV } = getNetworkConfigConstants(chainId)
  const { ensName, ensProfile, hasEnsProfile } = useEnsProfile(address)
  const [notConnected, setNotConnected] = useState(false);
  const { escrow: addressFirmInvEscrow } = useStakedInFirm(address);

  const cachedDelegate = delegates && delegates[address];
  const delegate = cachedDelegate && { ...cachedDelegate } || { address, votingPower: 0, votes: [], delegators: [], ensName: '' }

  const [tab, setTab] = useState<Tabs>('delegations');

  const { data } = useEtherSWR([
    [INV, 'delegates', account],
    [XINV, 'delegates', account],
    [INV, 'delegates', address],
  ])

  useDualSpeedEffect(() => {
    setNotConnected(!account)
  }, [account], !account, 1000, 0);

  if (notConnected) {
    return <Container label="Wallet Not Connected">
      <InfoMessage description="Please Connect your wallet" />
    </Container>
  }
  else if (!data) {
    return <Container label={<SkeletonTitle />}>
      <SkeletonBlob />
    </Container>
  }

  const [invDelegate, xinvDelegate, addressDelegate] = data;

  const isAlreadySameDelegate = (newlyChosenDelegate || data[0]) === address && invDelegate === xinvDelegate;

  const isSelf = account === address;

  if (!address || isLoading || !delegate) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const rank = (topDelegates.findIndex((topDelegate) => address === topDelegate.address) + 1) || ''

  const signDisabled = !isActive;

  const delegationCase = (isAlreadySameDelegate ? 'alreadyDelegating' : 'changingDelegation');

  const delegationCases = {
    changingDelegation: <SignDelegation signDisabled={signDisabled} signer={provider?.getSigner()} delegateAddress={address} isSelf={isSelf} />,
    alreadyDelegating: <AlreadyDelegating isSelf={isSelf} />, // already delegating to self or other
  }

  const supporters = (delegate?.delegators || []);

  const addressIsNotDelegating = addressDelegate === address || (!addressDelegate || addressDelegate === '0x0000000000000000000000000000000000000000');

  return (
    <VStack w="full">
      <Container
        collapsable={true}
        label={namedAddress(address, chainId, ensName)}
        description={isLargerThan780 ? address : shortenAddress(address)}
        href={`https://etherscan.io/address/${address}`}
        image={<Avatar sizePx={50} address={address} />}
        right={rank && <Text fontWeight="medium" fontSize="sm" color="secondaryTextColor">
          VP {shortenNumber(delegate?.votingPower)} - {`Rank ${rank}`}
        </Text>}
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
          {
            addressDelegate !== address && <InfoMessage alertProps={{ w: 'full' }} description={
              <>
                {namedAddress(address, chainId, ensName)} is Delegating to {addressDelegate && isAddress(addressDelegate) && addressDelegate !== address && addressDelegate !== BURN_ADDRESS ? <Link display="inline-block" textDecoration="underline" href={'/governance/delegates/' + addressDelegate}>{namedAddress(addressDelegate, chainId)}</Link> : 'Nobody'}
              </>
            } />
          }
          {
            addressDelegate === address && userAddress !== address && <InfoMessage alertProps={{ w: 'full' }} description={
              <>
                {namedAddress(address, chainId, ensName)} is Self-Delegating
              </>
            } />
          }
          {
            delegationCases[delegationCase]
          }
        </Box>
      </Container>
      <RadioCardGroup
        wrapperProps={{ pt: '5', w: 'full', justify: 'center', mt: '4', color: 'mainTextColor' }}
        group={{
          name: 'bool',
          defaultValue: tab,
          onChange: (t) => setTab(t),
        }}
        radioCardProps={{ w: '120px', textAlign: 'center', p: '2' }}
        options={[
          { label: 'Delegations', value: 'delegations' },
          { label: 'Delegators', value: 'supporters' },
          { label: 'Votes', value: 'votes' },
        ]}
      />
      <Divider py="1" />
      {
        tab === 'supporters' && <DelegateDetails delegateFirmInvEscrow={addressFirmInvEscrow} delegate={delegate} supporters={supporters} />
      }
      {
        tab === 'delegations' && <DelegatingEventsTable
          srcAddress={delegate.address}
          fromDelegate={addressIsNotDelegating ? delegate.address : undefined}
          toDelegate={addressIsNotDelegating ? delegate.address : undefined}
        />
      }
      {
        delegate?.address && tab === 'votes' && <PastVotesTable delegate={delegate} />
      }
    </VStack>
  )
}

export const DelegateDetails = ({ delegate, delegateFirmInvEscrow, supporters }: { delegate: Partial<Delegate>, delegateFirmInvEscrow: string, supporters: string[] }) => {
  const items = supporters.map((d) => ({
    address: d,
  }));

  const { INV, XINV } = getNetworkConfigConstants();

  const { data: exRateBn } = useEtherSWR(
    [XINV, 'exchangeRateStored']
  )

  const { data: invBalances } = useEtherSWR([
    ...items.map(item => [INV, 'balanceOf', item.address]),
  ]);

  const { data: xinvBalances } = useEtherSWR([
    ...items.map(item => [XINV, 'balanceOf', item.address]),
  ]);

  const exRate = exRateBn ? getBnToNumber(exRateBn) : 0;

  const itemsWithVotingPower = items.map((item, i) => {
    const invBalance = invBalances && invBalances[i] ? getBnToNumber(invBalances[i]) : 0;
    const xinvBalance = xinvBalances && xinvBalances[i] ? getBnToNumber(xinvBalances[i]) : 0;
    const delegatedPower = invBalance + xinvBalance * exRate;
    return {
      ...item,
      inv: invBalance,
      xinv: xinvBalance * exRate,
      delegatedPower,
      isOwnFirmEscrow: item.address === delegateFirmInvEscrow && delegateFirmInvEscrow !== BURN_ADDRESS,
    }
  });

  return (
    <SupportersTable delegate={delegate} delegators={itemsWithVotingPower} />
  )
}

export const DelegateView = () => {
  const [newlyChosenDelegate, setNewlyChosenDelegate] = useState('');
  const { chainId, account } = useWeb3React<Web3Provider>()
  const { query } = useRouter()

  const userAddress = (query.viewAddress as string) || account;

  const address = query.address as string
  const title = isAddress(address) ? namedAddress(address, chainId) : address

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Delegate Page</title>
        <meta name="og:title" content="Inverse Finance - Governance" />
        <meta name="og:description" content="Delegate Page" />
        <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/6yAG6AVICeMaq6CPntNZqZ/d25e6524959cbba190f4af4b42dbfb83/cover-governance.png?w=600&q=80" />
        <meta name="description" content="Inverse Finance DAO's Delegate Page" />
        <meta name="keywords" content="Inverse Finance, dao, inv, token, proposal, governance, voting power, delegate" />
      </Head>
      <AppNav active="Governance" activeSubmenu={address === userAddress ? 'Your Profile' : ''} />
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
        </Flex>
      </Flex>
    </Layout>
  )
}

export default DelegateView
