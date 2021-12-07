import { CloseIcon } from '@chakra-ui/icons'
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
    label: 'Stabilizer',
    href: '/stabilizer',
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

  if (!data) {
    return <></>
  }

  const [invBalance, xinvBalance, exchangeRate] = data
  const inv = invBalance / ETH_MANTISSA
  const xinv = (xinvBalance / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA)

  return (
    <NavBadge>{`${inv.toFixed(2)} INV (${xinv.toFixed(2)} xINV)`}</NavBadge>
  )
}

const ETHBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance } = useEtherSWR(['getBalance', account, 'latest'])

  if (!balance) {
    return <></>
  }
  return (
    <NavBadge>{`${(balance / ETH_MANTISSA).toFixed(4)} ETH`}</NavBadge>
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
  const [isOpen, setIsOpen] = useState(false)
  const { addressName } = useNamedAddress(account, chainId)
  const open = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)

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
          data-testid={TEST_IDS.connectBtn}
        >
          {active && account ? addressName : 'Connect'}
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
            {
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
            }
          </PopoverBody>
        )}
      </PopoverContent>
    </Popover>
  )
}

export const AppNav = ({ active }: { active?: string }) => {
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [showWrongNetModal, setShowWrongNetModal] = useState(false)
  const [isUnsupportedNetwork, setIsUsupportedNetwork] = useState(false)
  const { activate, active: walletActive, chainId, deactivate } = useWeb3React<Web3Provider>()
  const [badgeChainId, setBadgeChainId] = useState(chainId)
  
  const showWrongNetworkModal = () => setShowWrongNetModal(true)
  
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
    if(!badgeChainId) { return }

    const isSupported = isSupportedNetwork(badgeChainId);
    setIsUsupportedNetwork(!isSupported)
    setShowWrongNetModal(!isSupported);

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
        isOpen={showWrongNetModal}
        onClose={() => setShowWrongNetModal(false)}
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
              >
                {label}
              </Link>
            ))}
          </Stack>
        </Stack>
        <Stack display={{ base: 'flex', lg: 'none' }} direction="row" align="center">
          <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={showWrongNetworkModal} />
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
              <NetworkBadge isWrongNetwork={isUnsupportedNetwork} chainId={badgeChainId} showWrongNetworkModal={showWrongNetworkModal} />
              : null
          }
          <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={showWrongNetworkModal} />
        </Stack>
      </Flex>
      {showMobileNav && (
        <Flex w="full" position="absolute" transitionDuration="0.1s" transitionTimingFunction="ease">
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
