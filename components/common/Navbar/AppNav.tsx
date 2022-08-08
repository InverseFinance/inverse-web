import { CloseIcon, ViewIcon, ViewOffIcon, WarningIcon } from '@chakra-ui/icons'
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
  Box,
  VStack,
  useMediaQuery,
} from '@chakra-ui/react'
import { useBreakpointValue } from '@chakra-ui/media-query'
import { Web3Provider } from '@ethersproject/providers'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'
import { ETH_MANTISSA } from '@app/config/constants'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { ethereumReady, getPreviousConnectorType, setIsPreviouslyConnected, setPreviousChainId } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useEffect, useState } from 'react'
import { Announcement } from '@app/components/common/Announcement'
import WrongNetworkModal from '@app/components/common/Modal/WrongNetworkModal'
import { getNetwork, getNetworkConfigConstants, isSupportedNetwork } from '@app/util/networks'
import { isPreviouslyConnected } from '@app/util/web3';
import { NetworkItem } from '@app/components/common/NetworkItem'
import { NetworkIds } from '@app/types'
import { getINVsFromFaucet, getDOLAsFromFaucet } from '@app/util/contracts'
import { TEST_IDS } from '@app/config/test-ids'
import { useNamedAddress } from '@app/hooks/useNamedAddress'
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'
import { useRouter } from 'next/dist/client/router'
import { showToast } from '@app/util/notify'
import { useGovernanceNotifs } from '@app/hooks/useProposals';
import { NotifBadge } from '../NotifBadge'
import { ViewAsModal } from './ViewAsModal'
import { getEnsName, namedAddress } from '@app/util'
import { Avatar } from '@app/components/common/Avatar';
import { MENUS } from '@app/variables/menus'
import { injectedConnector, walletConnectConnector, walletLinkConnector } from '@app/variables/connectors'
import { WalletLinkConnector } from '@web3-react/walletlink-connector';
import { InjectedConnector } from '@web3-react/injected-connector';
import { RTOKEN_SYMBOL } from '@app/variables/tokens'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import useFantomBalance from '@app/hooks/useFantomBalance'
import { GasInfo } from '@app/components/common/Gas'
import { formatUnits } from 'ethers/lib/utils';
import { gaEvent } from '@app/util/analytics'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { BigNumber } from 'ethers'
import PostSearch from 'blog/components/post-search'

const NAV_ITEMS = MENUS.nav

const NavBadge = (props: any) => (
  <Flex
    justify="center"
    fontSize="12px"
    h="40px"
    align="center"
    bgColor="primary.800"
    borderRadius={4}
    borderWidth={1}
    borderColor="primary.700"
    fontWeight="semibold"
    color="mainTextColor"
    p={2}
    px={{ base: '2', xl: '4' }}
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
  const [isSmallerThan] = useMediaQuery('(max-width: 1200px)')
  const { data } = useEtherSWR(['getGasPrice']);

  const gasPrice = Math.floor(!data ? 0 : parseFloat(formatUnits(data, 'gwei')));

  const network = getNetwork(chainId || '');
  const bgColor = network?.bgColor || 'primary.800';

  return (
    <NavBadge
      cursor={isWrongNetwork ? 'pointer' : 'default'}
      onClick={isWrongNetwork ? showWrongNetworkModal : undefined} bgColor={bgColor}>
      <NetworkItem chainId={chainId} networkAttribute={isSmallerThan ? null : 'name'} />
      <Flex direction="row" color="red" ml="1">
        {
          !!gasPrice &&
          <GasInfo value={gasPrice} />
        }
      </Flex>
    </NavBadge>
  )
}

const INVBalance = () => {
  const router = useRouter()
  const { query } = router;
  const { account, chainId } = useWeb3React<Web3Provider>()
  const userAddress = (query?.viewAddress as string) || account;
  const { inv: invBalOnFantom } = useFantomBalance(userAddress)
  const { INV, XINV } = getNetworkConfigConstants(chainId);
  const { exchangeRates } = useExchangeRatesV2()
  const { data } = useEtherSWR([
    [INV, 'balanceOf', userAddress],
    [XINV, 'balanceOf', userAddress],
  ])
  const [formattedBalance, setFormattedBalance] = useState<ReactNode>(null)

  const exRate = exchangeRates ? exchangeRates[XINV] : 0;

  useDualSpeedEffect(() => {
    setFormattedBalance(userAddress ? formatData(data, exRate) : null)
  }, [data, userAddress, exRate], !userAddress, 1000)

  const goToSupply = () => {
    if (router.pathname === '/frontier') {
      const customEvent = new CustomEvent('open-anchor-supply', { detail: { market: 'inv' } });
      document.dispatchEvent(customEvent);
    } else {
      router.push({ pathname: '/frontier', query: { market: 'inv', marketType: 'supply' } });
    }
  }

  const formatData = (data: [number, number] | undefined, exchangeRate: BigNumber) => {
    const [invBalance, xinvBalance] = data || [0, 0, 1]
    const inv = invBalance / ETH_MANTISSA
    const xinv = (xinvBalance / ETH_MANTISSA) * (exchangeRate / ETH_MANTISSA)
    const hasUnstakedBal = inv >= 0.01
    return <>
      <Text onClick={goToSupply} cursor={hasUnstakedBal ? 'pointer' : undefined} mr="1" color={hasUnstakedBal ? 'orange.300' : 'mainTextColor'}>
        {inv.toFixed(2)} {RTOKEN_SYMBOL}
      </Text>
      ({xinv.toFixed(2)} x{RTOKEN_SYMBOL})
    </>
  }

  if (!formattedBalance || !data) {
    return <></>
  }

  const invBal = data[0] / ETH_MANTISSA;
  const onMainnetCase = invBal >= 0.01
  const onFantomCase = invBalOnFantom >= 0.01

  return (
    <NavBadge>
      {
        onMainnetCase || onFantomCase ?
          <AnimatedInfoTooltip message={
            <>
              {onMainnetCase && <Text>You have {invBal.toFixed(2)} <b>unstaked {RTOKEN_SYMBOL}</b></Text>}
              {onFantomCase && <Text mt={onMainnetCase && onFantomCase ? '2' : '0'}>
                You have {invBalOnFantom.toFixed(2)} <b>{RTOKEN_SYMBOL}</b> on Fantom
              </Text>}
              <Text mt="2">
                We recommend {onFantomCase && "bridging and"} staking all your {RTOKEN_SYMBOL} on Frontier to <b>earn rewards and avoid dilution</b>
              </Text>
            </>
          }>
            <WarningIcon color="orange.300" mr="1" />
          </AnimatedInfoTooltip>
          : null
      }
      {formattedBalance}
    </NavBadge>
  )
}

const ETHBalance = () => {
  const { query } = useRouter()
  const { account, chainId } = useWeb3React<Web3Provider>()
  const userAddress = (query?.viewAddress as string) || account;
  const { data: balance } = useEtherSWR(['getBalance', userAddress, 'latest'])
  const [formattedBalance, setFormattedBalance] = useState('')

  useDualSpeedEffect(() => {
    setFormattedBalance(balance ? (balance / ETH_MANTISSA).toFixed(2) : '')
  }, [balance, userAddress], !userAddress, 1000)

  if (!formattedBalance || !chainId) {
    return <></>
  }

  const network = getNetwork(chainId);

  return (
    <NavBadge>{`${formattedBalance} ${network.coinSymbol.toUpperCase()}`}</NavBadge>
  )
}

const ConnectionMenuItem = ({ ...props }: StackProps) => {
  return <Stack
    direction="row"
    align="center"
    p={4}
    pt={2}
    pb={2}
    _hover={{ bgColor: 'primary.850' }}
    {...props}
  />
}

// const LiquidationsMenuItem = ({
//   account,
//   ...props
// }: {
//   account: string | null,
// } & Partial<BadgeProps>) => {
//   const router = useRouter();
//   const nb = useNbUnseenLiquidations(account);

//   if (!nb) { return <></> }

//   return <ConnectionMenuItem onClick={() => router.push(`/transparency/liquidations?borrower=${account}`)}>
//     <WarningIcon boxSize={3} color="error" />
//     <Text fontWeight="semibold">
//       {nb} Unread liquidations
//     </Text>
//   </ConnectionMenuItem>
// }

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

  useDualSpeedEffect(() => {
    if (connector instanceof WalletLinkConnector && active) {
      setIsPreviouslyConnected(true, 'coinbase');
    } else if (connector instanceof InjectedConnector && active) {
      setIsPreviouslyConnected(true, 'injected');
    } else if (connector instanceof WalletConnectConnector && active) {
      setIsPreviouslyConnected(true, 'walletConnect');
    }
  }, [active, userAddress, connector], !userAddress, 1000)

  const disconnect = () => {
    close()
    // visually better
    setTimeout(() => {
      setIsPreviouslyConnected(false);
      deactivate()
      window.location.reload()
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
        activate(injectedConnector);
        gaEvent({ action: 'connect-metamask' })
      }, 100)
    }
  }

  const connectWalletConnect = () => {
    close()
    activate(walletConnectConnector)
    gaEvent({ action: 'connect-walletConnect' })
  }

  const connectCoinbaseWallet = () => {
    close()
    activate(walletLinkConnector)
    gaEvent({ action: 'connect-coinbaseWallet' })
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
          bgColor="primary.600"
          cursor="pointer"
          fontSize="sm"
          align="center"
          borderRadius={4}
          fontWeight="semibold"
          color="mainTextColor"
          p={2.5}
          pl={4}
          pr={4}
          _hover={{ bgColor: 'primary.600' }}
          alignItems="center"
          data-testid={TEST_IDS.connectBtn}
          position="relative"
        >
          {userAddress && <Avatar mr="2" sizePx={20} address={userAddress} />}
          <Text>{connectBtnLabel}</Text>
          {
            !!account && <LiquidationsBadge account={userAddress} position="absolute" top="-5px" right="-5px" />
          }
        </Flex>
      </PopoverTrigger>
      <PopoverContent
        cursor="pointer"
        w="full"
        bgColor="primary.800"
        color="mainTextColor"
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
              <ConnectionMenuItem
                onClick={connectCoinbaseWallet}
              >
                <Image w={6} h={6} src="/assets/wallets/coinbase.png" />
                <Text fontWeight="semibold">Coinbase Wallet</Text>
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
              onClick={() => {
                onViewAsOpen();
                gaEvent({ action: 'open-view-address' });
              }}
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
              !!account && <LiquidationsMenuItem account={userAddress} />
            } */}
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

export const AppNav = ({ active, activeSubmenu, isBlog = false }: { active?: string, activeSubmenu?: string, isBlog?: boolean }) => {
  const { query } = useRouter()
  const [isLargerThan] = useMediaQuery('(min-width: 1330px)');
  const { activate, active: walletActive, chainId, deactivate, account } = useWeb3React<Web3Provider>()
  const userAddress = (query?.viewAddress as string) || account;
  const [showMobileNav, setShowMobileNav] = useState(false)
  const { isOpen: isWrongNetOpen, onOpen: onWrongNetOpen, onClose: onWrongNetClose } = useDisclosure()

  const [isUnsupportedNetwork, setIsUsupportedNetwork] = useState(false)

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
      const previousConnectorType = getPreviousConnectorType();
      const connectors = {
        'coinbase': walletLinkConnector,
        'injected': injectedConnector,
        'walletConnect': walletConnectConnector,
      }
      const connector = connectors[previousConnectorType];
      activate(connector);
      setTimeout(() => activate(connector), 500);
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
        setTimeout(() => {
          const before = Number(window?.ethereum?.chainId)
          window?.ethereum?.on('chainChanged', (after) => {
            if (before !== after) { window.location.reload() }
          });
        }, 0)
      }
    }
    init();
  }, []);

  return (
    <>
      <WrongNetworkModal
        isOpen={isWrongNetOpen && !isBlog}
        onClose={onWrongNetClose}
      />
      <Flex
        w={isBlog ? '100vw' : '99vw'}
        backgroundColor="navBarBackground"
        borderColor="navBarBorderColor"
        borderBottomWidth={showMobileNav ? 0 : 1}
        p={4}
        justify="space-between"
        align="center"
        zIndex="docked"
        position="fixed"
        top="0"
      >
        <Stack direction="row" align="center" spacing={5}>
          <Link href="/">
            <Logo boxSize={10} />
          </Link>
          <Stack direction="row" align="center" spacing={isLargerThan || isBlog ? 6 : 5} display={{ base: 'none', lg: 'flex' }}>
            {NAV_ITEMS.map(({ label, href, submenus }, i) => (
              <Box
                key={i}
                href={href}
                fontWeight="medium"
                position="relative"

              >
                <Popover trigger="hover">
                  <PopoverTrigger>
                    <Box>
                      <Link
                        fontSize={isLargerThan || isBlog ? '16px' : '15px'}
                        color={active === label ? 'mainTextColor' : 'secondaryTextColor'}
                        _hover={{ color: 'mainTextColor' }}
                        href={href}>
                        {label}
                      </Link>
                      {
                        href === '/governance' && nbNotif > 0 &&
                        <NotifBadge>
                          {nbNotif}
                        </NotifBadge>
                      }
                    </Box>
                  </PopoverTrigger>
                  {
                    submenus?.length > 0 &&
                    <PopoverContent maxW="230px" background={isBlog ? 'mainBackgroundColor' : 'transparent'} border="none">
                      <PopoverBody className="blurred-container primary-bg compat-mode2" borderRadius="10px">
                        <VStack spacing="4" p="4">
                          {
                            submenus
                              .filter(s => !s.href.includes('$account') || (s.href.includes('$account') && !!userAddress))
                              ?.map(s => <Link key={s.href} color={active === label && activeSubmenu === s.label ? 'mainTextColor' : 'secondaryTextColor'} href={s.href.replace('$account', userAddress || '')}>{s.label}</Link>)
                          }
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  }
                </Popover>
              </Box>
            ))}
          </Stack>
        </Stack>
        {
          isBlog ?
            <PostSearch />
            :
            <>
              <Stack display={{ base: 'flex', lg: 'none' }} direction="row" align="center">
                <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={onWrongNetOpen} />
              </Stack>

              <Stack direction="row" align="center" display={{ base: 'none', lg: 'flex' }}>
                {
                  isLargerThan && <INVBalance />
                }
                <ETHBalance />
                {
                  badgeChainId ?
                    <NetworkBadge isWrongNetwork={isUnsupportedNetwork} chainId={badgeChainId} showWrongNetworkModal={onWrongNetOpen} />
                    : null
                }
                <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={onWrongNetOpen} />
              </Stack>
            </>
        }
        <Flex position="relative" display={{ base: 'flex', lg: 'none' }} w={6} h={6} onClick={() => setShowMobileNav(!showMobileNav)}>
          {showMobileNav ? (
            <Image w={4} h={4} src="/assets/cancel.svg" alt="Cancel" />
          ) : (
            <Image w={6} h={6} src="/assets/hamburger.svg" alt="Menu" />
          )}
          {
            active !== 'Governance' && !showMobileNav && nbNotif > 0 && <NotifBadge>
              {nbNotif}
            </NotifBadge>
          }
        </Flex>
      </Flex>
      {showMobileNav && (
        <Flex w="full" position="fixed" top="0" zIndex="9" transitionDuration="0.1s" transitionTimingFunction="ease">
          <Stack
            w="full"
            bgColor="primary.900"
            fontWeight="medium"
            spacing={6}
            p={4}
            pt={24}
            borderBottomWidth={1}
            borderColor="primary.800"
          >
            {NAV_ITEMS.map(({ label, href }, i) => (
              <Link w="fit-content" position="relative" key={i} href={href} color={active === label ? 'mainTextColor' : 'secondaryTextColor'}>
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
        </Flex>
      )}
      {!showMobileNav && !!process.env.NEXT_PUBLIC_ANNOUNCEMENT_MSG && <Announcement />}
    </>
  )
}

export default AppNav
