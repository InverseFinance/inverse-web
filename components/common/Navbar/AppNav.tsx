import { CloseIcon, MoonIcon, SunIcon, ViewIcon, ViewOffIcon, WarningIcon } from '@chakra-ui/icons'
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
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { MetaMask } from '@web3-react/metamask'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { useEffect, useRef, useState } from 'react'
import { Announcement } from '@app/components/common/Announcement'
import WrongNetworkModal from '@app/components/common/Modal/WrongNetworkModal'
import { getNetwork, getNetworkConfigConstants, isSupportedNetwork } from '@app/util/networks'
import { isPreviouslyConnected } from '@app/util/web3';
import { NetworkItem } from '@app/components/common/NetworkItem'
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
import { metamaskInjector, walletConnectV2, coinbaseWallet, gnosisSafe } from '@app/variables/connectors'

import { RTOKEN_SYMBOL } from '@app/variables/tokens'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { GasInfo } from '@app/components/common/Gas'
import { formatUnits } from 'ethers/lib/utils';
import { gaEvent } from '@app/util/analytics'
import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import PostSearch from 'blog/components/post-search'
import { switchTheme } from '@app/util/theme'
import { useAppTheme, useAppThemeParams } from '@app/hooks/useAppTheme'
import { CoinbasePayButton } from '@app/components/ThirdParties/CoinbasePay'
import { useCheckDBRAirdrop } from '@app/hooks/useDBR'
import { AirdropModalCheck } from '@app/components/F2/Infos/AirdropModalCheck'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { BurgerMenu } from './BurgerMenu'
import { useStakedInFirm } from '@app/hooks/useFirm'
import { useAccount } from '@app/hooks/misc'
import { PoaModal } from '../Modal/PoaModal'
import { checkPoaSig } from '@app/util/poa'
import { smartShortNumber } from '@app/util/markets'
import useSWR from 'swr'
const NAV_ITEMS = MENUS.nav

export const ThemeBtn = () => {
  const { themeName } = useAppTheme();
  const { BUTTON_BORDER_COLOR, BUTTON_BG, BUTTON_TEXT_COLOR } = useAppThemeParams();
  return <NavBadge
    cursor="pointer"
    bg={BUTTON_BG}
    border={`1px solid ${BUTTON_BORDER_COLOR}`}
    color={BUTTON_TEXT_COLOR}
    onClick={() => switchTheme()}
  >
    {themeName === 'dark' ? <SunIcon boxSize={4} /> : <MoonIcon boxSize={4} />}
  </NavBadge>
}

export const NavBadge = (props: any) => {
  const { NAV_BUTTON_BG, NAV_BUTTON_BORDER_COLOR, NAV_BUTTON_TEXT_COLOR } = useAppThemeParams();
  return <Flex
    justify="center"
    fontSize="12px"
    h="40px"
    align="center"
    bgColor={NAV_BUTTON_BG}
    borderRadius={4}
    borderWidth={1}
    borderColor={NAV_BUTTON_BORDER_COLOR}
    fontWeight="semibold"
    color={NAV_BUTTON_TEXT_COLOR}
    p={2}
    px={{ base: '2', xl: '3' }}
    {...props}
  />
}

const NetworkBadge = ({
  chainId,
  isWrongNetwork,
  showWrongNetworkModal
}: {
  chainId?: string | number,
  isWrongNetwork: boolean,
  showWrongNetworkModal: () => void
}) => {
  const [isSmallerThan1470] = useMediaQuery('(max-width: 1470px)')
  const [isSmallerThan1000] = useMediaQuery('(max-width: 1000px)')
  const { data } = useEtherSWR(['getGasPrice']);

  const gasPrice = Math.floor(!data ? 0 : parseFloat(formatUnits(data, 'gwei')));
  return (
    <NavBadge
      cursor={isWrongNetwork ? 'pointer' : 'default'}
      onClick={isWrongNetwork ? showWrongNetworkModal : undefined}
    // bg={'primary.800'}
    >
      <NetworkItem isSupported={!isWrongNetwork} chainId={chainId} networkAttribute={isSmallerThan1000 ? null : isSmallerThan1470 && !isSmallerThan1000 && chainId?.toString() !== '8453' ? 'coinSymbol' : 'name'} />
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
  const { INV, XINV } = getNetworkConfigConstants(chainId);
  const { exchangeRates } = useExchangeRatesV2()
  const { data } = useEtherSWR([
    [INV, 'balanceOf', userAddress],
    [XINV, 'balanceOf', userAddress],
  ])

  const { stakedInFirm } = useStakedInFirm(userAddress);

  const [invBalance, xinvBalance] = data || [0, 0]
  const exRate = exchangeRates ? exchangeRates[XINV] : 0;
  const inv = invBalance / ETH_MANTISSA
  const xinv = (xinvBalance / ETH_MANTISSA) * (exRate / ETH_MANTISSA) + stakedInFirm
  const hasUnstakedBal = inv >= 0.01;

  if (!data) {
    return <></>
  }

  const goToSupply = () => {
    router.push({ pathname: '/firm/INV' });
  }

  const onMainnetCase = inv >= 0.01

  return (
    <NavBadge>
      {
        onMainnetCase ?
          <AnimatedInfoTooltip message={
            <>
              {onMainnetCase && <Text>You have {inv.toFixed(2)} <b>unstaked {RTOKEN_SYMBOL}</b></Text>}
            </>
          }>
            <WarningIcon color="orange.300" mr="1" />
          </AnimatedInfoTooltip>
          : null
      }
      <>
        <Text onClick={goToSupply} cursor={hasUnstakedBal ? 'pointer' : undefined} mr="1" color={hasUnstakedBal ? 'orange.300' : 'mainTextColor'}>
          {smartShortNumber(inv, 2)} {RTOKEN_SYMBOL}
        </Text>
        ({smartShortNumber(xinv, 2)} x{RTOKEN_SYMBOL})
      </>
    </NavBadge>
  )
}

const ETHBalance = () => {
  const { query } = useRouter()
  const { account, chainId, provider } = useWeb3React<Web3Provider>()
  const userAddress = (query?.viewAddress as string) || account;
  const { data: balance } = useSWR(`${account}-${chainId}-bal`, () => {
    if (!account || !chainId || !provider) return undefined
    return provider.getBalance(account);
  })
  const [formattedBalance, setFormattedBalance] = useState('');

  useDualSpeedEffect(() => {
    setFormattedBalance(balance ? (balance / ETH_MANTISSA).toFixed(2) : '')
  }, [balance, userAddress, chainId], !userAddress, 1000)

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

const AppNavConnect = ({ isWrongNetwork, showWrongNetworkModal }: { isWrongNetwork: boolean, showWrongNetworkModal: () => void }) => {
  const web3react = useWeb3React<Web3Provider>()
  const { account, isActive: active, connector, chainId } = web3react
  const { deactivate: _deactivate } = connector || { activate: () => { }, deactivate: () => { } };
  const deactivate = _deactivate || connector?.actions?.resetState || (() => 0);

  const { query } = useRouter();
  const [isLargerThan300] = useMediaQuery('(min-width: 300px)');
  const userAddress = (query?.viewAddress as string) || account;
  const [isOpen, setIsOpen] = useState(false)
  const [connectBtnLabel, setConnectBtnLabel] = useState('Connect')
  const { addressName } = useNamedAddress(userAddress, chainId)
  const open = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const { isOpen: isViewAsOpen, onOpen: onViewAsOpen, onClose: onViewAsClose } = useDisclosure()
  const { BUTTON_BORDER_COLOR, BUTTON_BG, BUTTON_TEXT_COLOR } = useAppThemeParams();
  const [isIframe, setIsIframe] = useState(false);

  useDualSpeedEffect(() => {
    setConnectBtnLabel(active && userAddress ? addressName : 'Connect')
  }, [active, userAddress, addressName], !userAddress, 1000)

  useEffect(() => {
    setIsIframe(window.parent !== window);
  }, []);

  useDualSpeedEffect(() => {
    if (connector instanceof CoinbaseWallet && active) {
      setIsPreviouslyConnected(true, 'coinbase');
    } else if (connector instanceof MetaMask && active) {
      setIsPreviouslyConnected(true, 'injected');
    } else if (connector instanceof WalletConnectV2 && active) {
      setIsPreviouslyConnected(true, 'walletConnect');
    } else if (connector instanceof GnosisSafe && active) {
      setIsPreviouslyConnected(true, 'safe-app');
    }
  }, [active, userAddress, connector], !userAddress, 1000)

  const disconnect = () => {
    close()
    // visually better
    setTimeout(() => {
      setIsPreviouslyConnected(false);
      try {
        deactivate();
      } catch (e) { console.log(e) }
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
        metamaskInjector?.activate();
        gaEvent({ action: 'connect-metamask' })
      }, 100)
    }
  }

  const connectWalletConnect = () => {
    close()
    walletConnectV2?.activate();
    gaEvent({ action: 'connect-walletConnect' })
  }

  const connectCoinbaseWallet = () => {
    close()
    coinbaseWallet?.activate();
    // activate(location.pathname === '/swap' ? metamaskInjector : metamaskInjector)    
    gaEvent({ action: 'connect-coinbaseWallet' })
  }

  const connectSafeApp = () => {
    close()
    gnosisSafe?.activate();
    // activate(location.pathname === '/swap' ? metamaskInjector : metamaskInjector)    
    gaEvent({ action: 'connect-safe-app' })
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
          bg={BUTTON_BG}
          border={`1px solid ${BUTTON_BORDER_COLOR}`}
          color={BUTTON_TEXT_COLOR}
          cursor="pointer"
          fontSize="sm"
          align="center"
          borderRadius={4}
          fontWeight="semibold"
          p={2.5}
          pl={4}
          pr={4}
          h="40px"
          _hover={{ filter: 'brightness(1.25)' }}
          alignItems="center"
          data-testid={TEST_IDS.connectBtn}
          position="relative"
        >
          {!!userAddress && isLargerThan300 && <Avatar mr="2" sizePx={20} address={userAddress} />}
          <Text color={BUTTON_TEXT_COLOR}>{connectBtnLabel}</Text>
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
              {
                isIframe && <ConnectionMenuItem
                  onClick={connectSafeApp}
                >
                  <Image borderRadius="4px" w={6} h={6} src="/assets/wallets/gnosis-safe.jpeg" />
                  <Text fontWeight="semibold">Gnosis Safe</Text>
                </ConnectionMenuItem>
              }
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
            {
              !!account &&
              <CoinbasePayButton account={account}>
                <ConnectionMenuItem>
                  <Image w={'12px'} h={'12px'} src="/assets/projects/coinbase.svg" />
                  <Text fontWeight="semibold">Coinbase Pay</Text>
                </ConnectionMenuItem>
              </CoinbasePayButton>
            }
          </PopoverBody>
        )}
      </PopoverContent>
    </Popover>
  )
}

export const AppNav = ({ active, activeSubmenu, isBlog = false, isClaimPage = false, hideAnnouncement = false }: { active?: string, activeSubmenu?: string, isBlog?: boolean, isClaimPage?: boolean, hideAnnouncement?: boolean }) => {
  const { account } = useWeb3React<Web3Provider>();
  const { query } = useRouter()
  const [isLargerThan] = useMediaQuery('(min-width: 1330px)');
  const [isLargerThan1300] = useMediaQuery('(min-width: 1300px)');
  const [isLargerThan1150] = useMediaQuery('(min-width: 1150px)');
  const [isLargerThan768] = useMediaQuery('(min-width: 768px)');
  const { themeName } = useAppTheme();
  const { isActive, chainId } = useWeb3React<Web3Provider>();

  const userAddress = useAccount();
  const { isEligible, hasClaimed, isLoading } = useCheckDBRAirdrop(userAddress);
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const { isOpen: isWrongNetOpen, onOpen: onWrongNetOpen, onClose: onWrongNetClose } = useDisclosure()
  const { isOpen: isAirdropOpen, onOpen: onAirdropOpen, onClose: onAirdropClose } = useDisclosure()
  const { isOpen: isTosOpen, onOpen: onTosOpen, onClose: onTosClose } = useDisclosure()
  const [onTosOk, setOnTosOk] = useState(() => () => { });
  const [tosApproved, setTosApproved] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    const init = async () => {
      const checkSigData = await checkPoaSig(account);
      if (!isMountedRef.current) return;
      setTosApproved(!!checkSigData?.accepted);
    }
    if (!account) {
      setTosApproved(false);
      return;
    }
    init();
    return () => {
      isMountedRef.current = false;
    }
  }, [account]);

  useEffect(() => {
    const tosOpen = (d) => {
      if (tosApproved) {
        d.detail.onOk()();
        return;
      } else {
        setOnTosOk(d.detail.onOk);
        onTosOpen();
      };
    }
    document.addEventListener('poa-modal', tosOpen);
    return () => {
      document.removeEventListener('poa-modal', tosOpen, false);
    }
  }, [tosApproved]);

  const [isUnsupportedNetwork, setIsUsupportedNetwork] = useState(false)

  const [badgeChainId, setBadgeChainId] = useState(chainId)
  const { nbNotif } = useGovernanceNotifs();

  useDebouncedEffect(() => {
    if (isLoading) return
    setShowAirdropModal(isEligible && !hasClaimed);
  }, [isEligible, hasClaimed, isLoading], 5000);

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
    if (!isUnsupportedNetwork && !isActive && isPreviouslyConnected()) {
      const previousConnectorType = getPreviousConnectorType();
      const connectors = {
        'coinbase': coinbaseWallet,
        'injected': metamaskInjector,
        'walletConnect': walletConnectV2,
        'safe-app': gnosisSafe,
      }
      const previousConnector = connectors[previousConnectorType];
      if (previousConnector) {
        void previousConnector.connectEagerly().catch(() => {
          console.debug('Failed to connect eagerly')
        });
      }
      // setTimeout(() => activate(connector), 500);
    }
  }, [isActive, isUnsupportedNetwork]);

  // chainId exists only if user is connected
  useEffect(() => {
    if (!chainId) { return }
    setPreviousChainId(chainId);
    setBadgeChainId(chainId);
  }, [chainId]);

  // badgeChainId exists if user is connected or there is an injected provider present like metamask
  useEffect(() => {
    if (!badgeChainId) { return }
    // swap page: any network is fine
    const isSupported = ['/swap', '/base', '/zap', '/transparency/liquidity', '/tokens/yield-opportunities'].includes(location.pathname) || isSupportedNetwork(badgeChainId);
    setIsUsupportedNetwork(!isSupported)
    if (!isSupported) {
      onWrongNetOpen();
    } else { onWrongNetClose() }
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
            if (before !== after && !['/swap', '/zap', '/transparency/liquidity', '/tokens/yield-opportunities'].includes(location.pathname)) { window.location.reload() }
          });
        }, 0)
      }
    }
    init();
  }, []);

  return (
    <VStack w='full' spacing="0">
      <PoaModal isOpen={isTosOpen} onClose={onTosClose} onOk={() => onTosOk()} onSuccess={() => setTosApproved(true)} />
      <WrongNetworkModal
        isOpen={isWrongNetOpen && !isBlog}
        onClose={onWrongNetClose}
      />
      {
        showAirdropModal && <AirdropModalCheck
          isOpen={isAirdropOpen}
          onOpen={onAirdropOpen}
          onClose={onAirdropClose}
        />
      }
      <Flex
        w={'100vw'}
        background="navBarBackground"
        backgroundColor="navBarBackgroundColor"
        borderColor="navBarBorderColor"
        borderBottomWidth={1}
        p={4}
        justify="space-between"
        align="center"
        zIndex="docked"
        position="fixed"
        top="0"
      >
        <Stack direction="row" align="center" spacing={5}>
          <Link href="/">
            <Logo minW='40px' boxSize={10} noFilter={true} />
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
                    <PopoverContent maxW="275px" background={isBlog ? 'mainBackgroundColor' : 'transparent'} border="none">
                      <PopoverBody className={`blurred-container ${themeName}-bg compat-mode2`} borderRadius="10px">
                        <VStack spacing="2" p="4">
                          {
                            submenus
                              .filter(s => !s.href.includes('$account') || (s.href.includes('$account') && !!userAddress))
                              ?.map(s => <Link
                                key={s.href}
                                onClick={s.needReload ? () => location.href = s.href : undefined}
                                color={active === label && activeSubmenu === s.label ? 'mainTextColor' : 'secondaryTextColor'}
                                display="inline-flex"
                                alignItems="center"
                                h="30px"
                                transform="translateY(0px)"
                                href={s.href.replace('$account', userAddress || '')}
                              >
                                {s.label}
                              </Link>)
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
                <ThemeBtn />
                <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={onWrongNetOpen} />
              </Stack>

              <Stack direction="row" align="center" display={{ base: 'none', lg: 'flex' }}>
                {
                  isLargerThan1300 && <INVBalance />
                }
                {
                  isLargerThan1150 && <ETHBalance />
                }
                {
                  badgeChainId ?
                    <NetworkBadge isWrongNetwork={isUnsupportedNetwork} chainId={badgeChainId} showWrongNetworkModal={onWrongNetOpen} />
                    : null
                }
                <ThemeBtn />
                <AppNavConnect isWrongNetwork={isUnsupportedNetwork} showWrongNetworkModal={onWrongNetOpen} />
              </Stack>
            </>
        }
        <BurgerMenu active={active} activeSubmenu={activeSubmenu} userAddress={userAddress} nbNotif={nbNotif} navItems={NAV_ITEMS} />
      </Flex>
      {isLargerThan768 && !!process.env.NEXT_PUBLIC_ANNOUNCEMENT_MSG && !hideAnnouncement && <Announcement />}
    </VStack>
  )
}

export default AppNav
