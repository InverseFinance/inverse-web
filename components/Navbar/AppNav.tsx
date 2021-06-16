import { Flex, Stack } from '@chakra-ui/react'
import Logo from '@inverse/components/Logo'
import Link from '@inverse/components/Link'
import { ConnectButton, OutlineButton } from '../Button'
import { injectedConnector } from '@inverse/util/web3'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { ETH_MANTISSA, INV, XINV } from '@inverse/constants'
import { CTOKEN_ABI, XINV_ABI } from '@inverse/abis'
import useEtherSWR from '@inverse/hooks/useEtherSWR'

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
  const { account, library, activate, active } = useWeb3React<Web3Provider>()

  return (
    <Stack direction="row" align="center">
      <INVBalance />
      <ETHBalance />
      <ConnectButton onClick={() => activate(injectedConnector)}>
        {active && account ? `${account.substr(0, 6)}...${account.substr(account.length - 4)}` : 'Connect'}
      </ConnectButton>
    </Stack>
  )
}

export const AppNav = ({ active }: { active?: string }) => {
  return (
    <Flex
      w="full"
      backgroundColor="purple.900"
      borderColor="purple.800"
      borderBottomWidth={1}
      p={4}
      justify="space-between"
      color="#fff"
    >
      <Stack direction="row" align="center" spacing={8}>
        <Link href="/">
          <Logo boxSize={10} />
        </Link>
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
      <AppNavConnect />
    </Flex>
  )
}

export default AppNav
