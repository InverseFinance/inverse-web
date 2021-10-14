import { Flex, Image, Stack, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, Button } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { OutlineButton } from '@inverse/components/Button'
import Link from '@inverse/components/Link'
import Logo from '@inverse/components/Logo'
import { ETH_MANTISSA, INV, XINV } from '@inverse/config'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { namedAddress } from '@inverse/util'
import { injectedConnector, walletConnectConnector } from '@inverse/util/web3'
import { useWeb3React } from '@web3-react/core'
import { useState } from 'react'

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
    label: 'Stake',
    href: '/stake',
  },
  {
    label: 'Governance',
    href: '/governance',
  },
]

const INVBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
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

  return <OutlineButton>{`${inv.toFixed(2)} INV (${xinv.toFixed(2)} xINV)`}</OutlineButton>
}

const ETHBalance = () => {
  const { account } = useWeb3React<Web3Provider>()
  const { data: balance } = useEtherSWR(['getBalance', account, 'latest'])

  if (!balance) {
    return <></>
  }
  return <OutlineButton>{`${(balance / ETH_MANTISSA).toFixed(4)} ETH`}</OutlineButton>
}

const AppNavConnect = () => {
  const { account, activate, active, deactivate, connector } = useWeb3React<Web3Provider>()
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)

  const connectMetamask = () => {
    activate(injectedConnector);
    if (typeof window !== "undefined") {
      window.localStorage.setItem('previouslyConnected', JSON.stringify(true))
    }
    close()
  }

  const connectWalletConnect = () => {
    activate(walletConnectConnector);
    close()
  }

  const disconnect = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem('previouslyConnected', JSON.stringify(false))
    }
    deactivate()
    close()
  }

  let connectorName;
  if(connector) {
    const name = connector.constructor.name
    if(name === "InjectedConnector") connectorName = "Metamask"
    if(name === "WalletConnectConnector") connectorName = "Wallet Connect"
  }

  return (
    <Popover
    placement="bottom-end"
    onClose={close}
    isOpen={isOpen}>
      <PopoverTrigger>
      <Button
        onClick={open}
        justify="center"
        bgColor="purple.500"
        cursor='pointer'
        fontSize="sm"
        align="center"
        borderRadius={4}
        fontWeight="semibold"
        color="#fff"
        p={2}
        pl={4}
        pr={4}
        _hover={{ bgColor: 'purple.600' }}
      >
      {active && account ? `${namedAddress(account)}` : 'Connect'}
      </Button>
      </PopoverTrigger>
      <PopoverContent bgColor="#211e36" color="#fff" border={0}>
        <PopoverArrow bg="#211e36"/>
        <PopoverCloseButton />
        <PopoverHeader>{active? connectorName: 'Connect Wallet'}</PopoverHeader>
        {!active && <PopoverBody>
          <Button
          justify="center"
          bgColor="purple.500"
          cursor='pointer'
          fontSize="sm"
          align="center"
          borderRadius={4}
          fontWeight="semibold"
          color="#fff"
          p={2}
          pl={4}
          pr={4}
          _hover={{ bgColor: 'purple.600' }}
          onClick={connectMetamask}
          >
            Metamask
          </Button>
          <Button
          marginLeft={3}
          justify="center"
          bgColor="purple.500"
          cursor='pointer'
          fontSize="sm"
          align="center"
          borderRadius={4}
          fontWeight="semibold"
          color="#fff"
          p={2}
          pl={4}
          pr={4}
          _hover={{ bgColor: 'purple.600' }}
          onClick={connectWalletConnect}
          >
            Wallet Connect
          </Button>
        </PopoverBody>}
        {active && <PopoverBody>
          <Button
          marginLeft={3}
          justify="center"
          bgColor="red.500"
          cursor='pointer'
          fontSize="sm"
          align="center"
          borderRadius={4}
          fontWeight="semibold"
          color="#fff"
          p={2}
          pl={4}
          pr={4}
          _hover={{ bgColor: 'red.600' }}
          onClick={disconnect}
          >
            Disconnect
          </Button>
        </PopoverBody>}
      </PopoverContent>
    </Popover>
  )
}

export const AppNav = ({ active }: { active?: string }) => {
  const [showMobileNav, setShowMobileNav] = useState(false)
  const { activate, active: walletActive } = useWeb3React<Web3Provider>()
  if (typeof window !== "undefined" && !walletActive) {
    const previouslyConnected = JSON.parse(window.localStorage.getItem('previouslyConnected'));
    if(previouslyConnected) {
      activate(injectedConnector);
    }
  }

  return (
    <>
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
          <AppNavConnect />
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
          <AppNavConnect />
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
    </>
  )
}

export default AppNav
