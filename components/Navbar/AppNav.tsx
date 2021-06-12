import { Flex, Stack } from '@chakra-ui/react'
import Logo from '@inverse/components/Logo'
import Link from '@inverse/components/Link'
import { ConnectButton } from '../Button'

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

export const AppNav = ({ active }: { active?: string }) => (
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
        <Link href={href} fontWeight="medium" color={active === label ? '#fff' : 'purple.100'}>
          {label}
        </Link>
      ))}
    </Stack>
    <ConnectButton />
  </Flex>
)

export default AppNav
