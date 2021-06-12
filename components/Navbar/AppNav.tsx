import { Flex, Stack } from '@chakra-ui/react'
import Logo from '@inverse/components/Logo'
import Link from '@inverse/components/Link'
import { ConnectButton } from '../Button'
import { injectedConnector } from '@inverse/util/web3'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'

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

export const AppNav = ({ activeNav }: { activeNav?: string }) => {
  const { account, activate, active } = useWeb3React<Web3Provider>()
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
        <Logo boxSize={10} />
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            href={href}
            fontWeight="medium"
            color={activeNav === label ? '#fff' : 'purple.200'}
            _hover={{ color: '#fff' }}
          >
            {label}
          </Link>
        ))}
      </Stack>
      <ConnectButton onClick={() => activate(injectedConnector)}>
        {active && account ? `${account.substr(0, 6)}...${account.substr(account.length - 4)}` : 'Connect'}
      </ConnectButton>
    </Flex>
  )
}

export default AppNav
