import { CloseIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import {
  Flex,
  Image,
  Stack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Text,
  StackProps,
  useDisclosure,
  Badge,
} from '@chakra-ui/react'
import { useBreakpointValue } from '@chakra-ui/media-query'
import { Web3Provider } from '@ethersproject/providers'
import Link from '@inverse/components/common/Link'
import Logo from '@inverse/components/common/Logo'
import { ETH_MANTISSA } from '@inverse/config/constants'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { ethereumReady, injectedConnector, setIsPreviouslyConnected, setPreviousChainId, walletConnectConnector } from '@inverse/util/web3'
import { useWeb3React } from '@web3-react/core'
import { useEffect, useState } from 'react'
import { Announcement } from '@inverse/components/common/Announcement'
import WrongNetworkModal from '@inverse/components/common/Modal/WrongNetworkModal'
import { getNetwork, getNetworkConfigConstants, isSupportedNetwork } from '@inverse/config/networks'
import { isPreviouslyConnected } from '@inverse/util/web3';
import { NetworkItem } from '@inverse/components/common/NetworkItem'
import { NetworkIds } from '@inverse/types'
import { getINVsFromFaucet, getDOLAsFromFaucet } from '@inverse/util/contracts'
import { TEST_IDS } from '@inverse/config/test-ids'
import { useNamedAddress } from '@inverse/hooks/useNamedAddress'
import { useDualSpeedEffect } from '@inverse/hooks/useDualSpeedEffect'
import { useRouter } from 'next/dist/client/router'
import { showToast } from '@inverse/util/notify'
import { ViewAsModal } from './ViewAsModal'
import { getEnsName, namedAddress } from '@inverse/util'
import { Avatar } from '@inverse/components/common/Avatar';
import { useGovernanceNotifs, useProposals } from '@inverse/hooks/useProposals';
import { NotifBadge } from '../NotifBadge'
import { useDebouncedEffect } from '@inverse/hooks/useDebouncedEffect'

const NAV_ITEMS = [
  {
    label: 'Anchor',
    href: '/anchor',
  },
  {
    label: 'Vaults',
    href: '/vaults',
  },
  {
    label: 'Swap',
    href: '/swap/DAI/DOLA',
  },
  {
    label: 'Governance',
    href: '/governance',
  },
]

const NavBadge = (props: any) => (
  <Flex
    justify="center"
    fontSize="sm"
    align="center"
    bgColor="purple.800"
    borderRadius={4}
    borderWidth={1}
    borderColor="purple.700"
    fontWeight="semibold"
    color="#fff"
    p={2}
    pl={4}
    pr={4}
    {...props}
  />
)

const NetworkBadge = ({
  chainId,
  isWrongNetwork,
  showWrongNetworkModal
}: {
  chainId?: string | number,
  isWrongNetwork: boolean,
  showWrongNetworkModal: () => void
}) => {
  const network = getNetwork(chainId || '');
  const bgColor = network?.bgColor || 'purple.800';
  return (
    <NavBadge
      cursor={isWrongNetwork ? 'pointer' : 'default'}
      onClick={isWrongNetwork ? showWrongNetworkModal : undefined} bgColor={bgColor}>
      <NetworkItem chainId={chainId} />
    </NavBadge>
  )
}

const INVBalance = () => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { INV, XINV } = getNetworkConfigConstants(chainId);
  const { data } = useEtherSWR([
    [INV, 'balanceOf', account],
    [XINV, 'balanceOf', account],
    [XINV, 'exchangeRateStored'],
  ])
  const [formattedBalance, setFormattedBalance] = useState('')

  useDualSpeedEffect(() => {
    setFormattedBalance(account ? formatData(data) : '')
  }, [data, account], !account, 1000)

  const formatData = (data: [number, number, number] | undefined) => {
    const [invBalance, xinvBalance, exchangeRate] = data || [0, 0, 1]
    const inv = invBalance / ETH_MANTISSA
    const xinv = (xinvBalance / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA)
    return `${inv.toFixed(2)} INV (${xinv.toFixed(2)} xINV)`
  }

  if (!formattedBalance) {
    return <></>
  }

  return (
    <NavBadge>{formattedBalance}</NavBadge>
  )
}

const ETHBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance } = useEtherSWR(['getBalance', account, 'latest'])
  const [formattedBalance, setFormattedBalance] = useState('')

  useDualSpeedEffect(() => {
    setFormattedBalance(balance ? (balance / ETH_MANTISSA).toFixed(4) : '')
  }, [balance, account], !account, 1000)

  if (!formattedBalance) {
    return <></>
  }

  return (
    <NavBadge>{`${formattedBalance} ETH`}</NavBadge>
  )
}

const ConnectionMenuItem = ({ ...props }: StackProps) => {
  return <Stack
    direction="row"
    align="center"
    p={4}
    pt={2}
    pb={2}
    _hover={{ bgColor: 'purple.850' }}
    {...props}
  />
}

const AppNavConnect = ({ isWrongNetwork, showWrongNetworkModal }: { isWrongNetwork: boolean, showWrongNetworkModal: () => void }) => {
  const { account, activate, active, deactivate, connector, chainId, library } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const [isOpen, setIsOpen] = useState(false)
  const [connectBtnLabel, setConnectBtnLabel] = useState('Connect')
  const { addressName } = useNamedAddress(userAddress, chainId)
  const open = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const { isOpen: isViewAsOpen, onOpen: onViewAsOpen, onClose: onViewAsClose } = useDisclosure()

  useDualSpeedEffect(() => {
    setConnectBtnLabel(active && userAddress ? addressName : 'Connect')
  }, [active, userAddress, addressName], !userAddress, 1000)

  const disconnect = () => {
    close()
    // visually better
    setTimeout(() => {
      setIsPreviouslyConnected(false);
      deactivate()
    }, 100)
  }

  const connectMetamask = () => {
    if (isWrongNetwork) {
      disconnect()
      showWrongNetworkModal();
    } else {
      close()
      // visually better
      setTimeout(() => {
        activate(injectedConnector)
        setIsPreviouslyConnected(true);
      }, 100)
    }
  }

  const connectWalletConnect = () => {
    close()
    activate(walletConnectConnector)
  }

  let connectorName
  if (connector) {
    if (connector.walletConnectProvider) connectorName = 'WalletConnect'
    else connectorName = 'Metamask'
  }

  return (
    <Popover onClose={close} onOpen={open} isOpen={isOpen} placement="bottom"
      trigger={useBreakpointValue({ base: 'click', md: 'hover' })}>
      {
        isViewAsOpen && <ViewAsModal
          isOpen={isViewAsOpen}
          onClose={onViewAsClose}
        />
      }
      <PopoverTrigger>
        <Flex
          justify="center"
          bgColor="purple.600"
          cursor="pointer"
          fontSize="sm"
          align="center"
          borderRadius={4}
          fontWeight="semibold"
          color="#fff"
          p={2.5}
          pl={4}
          pr={4}
          _hover={{ bgColor: 'purple.600' }}
          alignItems="center"
          data-testid={TEST_IDS.connectBtn}
        >
          {userAddress && <Avatar sizePx={20} address={userAddress} />}
          <Text ml="2">{connectBtnLabel}</Text>
        </Flex>
      </PopoverTrigger>
      <PopoverContent
        cursor="pointer"
        w="full"
        bgColor="purple.800"
        color="#fff"
        border={0}
        _focus={{}}
        zIndex="sticky"
      >
        {!active && (
          <PopoverBody p={0}>
            <Stack w="full">
              <ConnectionMenuItem
                onClick={connectMetamask}
              >
                <Image w={6} h={6} src="/assets/wallets/Metamask.png" />
                <Text fontWeight="semibold">Metamask</Text>
              </ConnectionMenuItem>
              <ConnectionMenuItem
                onClick={connectWalletConnect}
              >
                <Image w={6} h={6} src="/assets/wallets/WalletConnect.svg" />
                <Text fontWeight="semibold">WalletConnect</Text>
              </ConnectionMenuItem>
            </Stack>
          </PopoverBody>
        )}
        {active && (
          <PopoverBody p={0}>
            <ConnectionMenuItem
              onClick={disconnect}
            >
              <CloseIcon color="red" boxSize={3} />
              <Text fontWeight="semibold">Disconnect</Text>
            </ConnectionMenuItem>
            <ConnectionMenuItem
              onClick={onViewAsOpen}
            >
              <ViewIcon color="blue.600" boxSize={3} />
              <Text fontWeight="semibold">View Address</Text>
            </ConnectionMenuItem>
            {
              query?.viewAddress && <ConnectionMenuItem
                onClick={() => window.location.search = ''}
              >
                <ViewOffIcon color="blue.600" boxSize={3} />
                <Text fontWeight="semibold">Clear View Address</Text>
              </ConnectionMenuItem>
            }
            {/* {
              !!chainId && chainId.toString() === NetworkIds.rinkeby ?
                <>
                  <ConnectionMenuItem
                    onClick={() => getINVsFromFaucet(library?.getSigner())}
                  >
                    <Image boxSize={3} src={'/assets/favicon.png'} />
                    <Text fontWeight="semibold">Get INVs</Text>
                  </ConnectionMenuItem>
                  <ConnectionMenuItem
                    onClick={() => getDOLAsFromFaucet(library?.getSigner())}
                  >
                    <Image boxSize={3} src={'https://assets.coingecko.com/coins/images/14287/small/anchor-logo-1-200x200.png'} />
                    <Text fontWeight="semibold">Get DOLAs</Text>
                  </ConnectionMenuItem>
                </>
                : null
            } */}
          </PopoverBody>
        )}
      </PopoverContent>
    </Popover>
  )
}

export const AppNav = ({ active }: { active?: string }) => {
  const { query } = useRouter()
  const [showMobileNav, setShowMobileNav] = useState(false)
  const { isOpen: isWrongNetOpen, onOpen: onWrongNetOpen, onClose: onWrongNetClose } = useDisclosure()

  const [isUnsupportedNetwork, setIsUsupportedNetwork] = useState(false)
  const { activate, active: walletActive, chainId, deactivate } = useWeb3React<Web3Provider>()
  const [badgeChainId, setBadgeChainId] = useState(chainId)
  const { nbNotif } = useGovernanceNotifs();

  useEffect(() => {
    const init = async () => {
      if (query?.viewAddress) {
        const address = query?.viewAddress as string
        const ens = await getEnsName(address);
        showToast({
          status: 'info',
          title: 'Viewing Address:',
          description: `${namedAddress(address)}${ens ? ` (${ens})` : ''}`,
          duration: 15000,
        })
      }
    }
    init()
  }, [query])

  useEffect(() => {
    if (!walletActive && isPreviouslyConnected()) {
      activate(injectedConnector);
      setTimeout(() => activate(injectedConnector), 500);
    }
  }, [walletActive]);

  // chainId exists only if user is connected
  useEffect(() => {
    if (!chainId) { return }
    setPreviousChainId(chainId);
    setBadgeChainId(chainId);
  }, [chainId]);

  // badgeChainId exists if user is connected or there is an injected provider present like metamask
  useEffect(() => {
    if (!badgeChainId) { return }

    const isSupported = isSupportedNetwork(badgeChainId);
    setIsUsupportedNetwork(!isSupported)
    if (!isSupported) { onWrongNetOpen() }
    else { onWrongNetClose() }

    if (!isSupported) {
      setIsPreviouslyConnected(false);
      deactivate();
    }
  }, [badgeChainId]);

  useEffect(() => {
    // we can know the injected provider's network and show the badge even if the user is not connected to our app
    const init = async () => {
      const isReady = await ethereumReady(10000);
      if (!isReady) { return }
      // use chainId not networkVersion
      const chainIdInWallet = parseInt(window?.ethereum?.chainId, 16);
      if (!chainIdInWallet) { return }

      setBadgeChainId(chainIdInWallet);

      if (window?.ethereum) {
        window?.ethereum?.on('chainChanged', () => window.location.reload());
      }
    }
    init();
  }, []);

  return (
    <>
      <WrongNetworkModal
        isOpen={isWrongNetOpen}
        onClose={onWrongNetClose}
      />
      <Flex
        w="full"
        backgroundColor="purple.900"
        borderColor="purple.800"
        borderBottomWidth={showMobileNav ? 0 : 1}
        p={4}
        justify="space-between"
        align="center"
        zIndex="docked"
      >
        <Stack direction="row" align="center" spacing={8}>
          <Link href="/">
            <Logo boxSize={10} />
          </Link>
          <Stack direction="row" align="center" spacing={8} display={{ base: 'none', lg: 'flex' }}>
            {NAV_ITEMS.map(({ label, href }, i) => (
              <Link
                key={i}
                href={href}
                fontWeight="medium"
                color={active === label ? '#fff' : 'purple.200'}
                _hover={{ color: '#fff' }}
                position="relative"
              >
                {label}
                {
                  href === '/governance' && nbNotif > 0 &&
                  <NotifBadge>
                    {nbNotif}
                  </NotifBadge>
                }
              </Link>
            ))}
          </Stack>
        </Stack>
        <Stack display={{ base: 'flex', lg: 'none' }} direction="row" align="center">
          <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={onWrongNetOpen} />
        </Stack>
        <Flex display={{ base: 'flex', lg: 'none' }} w={6} onClick={() => setShowMobileNav(!showMobileNav)}>
          {showMobileNav ? (
            <Image w={4} h={4} src="/assets/cancel.svg" />
          ) : (
            <Image w={6} h={6} src="/assets/hamburger.svg" />
          )}
        </Flex>
        <Stack direction="row" align="center" display={{ base: 'none', lg: 'flex' }}>
          <INVBalance />
          <ETHBalance />
          {
            badgeChainId ?
              <NetworkBadge isWrongNetwork={isUnsupportedNetwork} chainId={badgeChainId} showWrongNetworkModal={onWrongNetOpen} />
              : null
          }
          <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={onWrongNetOpen} />
        </Stack>
      </Flex>
      {showMobileNav && (
        <Flex w="full" position="absolute" zIndex="1" transitionDuration="0.1s" transitionTimingFunction="ease">
          <Stack
            w="full"
            bgColor="purple.900"
            fontWeight="medium"
            spacing={6}
            p={4}
            pt={24}
            borderBottomWidth={1}
            borderColor="purple.800"
          >
            {NAV_ITEMS.map(({ label, href }, i) => (
              <Link key={i} href={href} color={active === label ? '#fff' : 'purple.200'}>
                {label}
              </Link>
            ))}
          </Stack>
        </Flex>
      )}
      {!showMobileNav && <Announcement />}
    </>
  )
}

export default AppNav
