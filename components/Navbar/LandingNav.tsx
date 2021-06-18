import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import LinkButton from '@inverse/components/Button'
import Logo from '@inverse/components/Logo'
import { useState } from 'react'
import Link from '../Link'

const INVERSE_NAV = [
  {
    label: 'Docs',
    href: 'https://docs.inverse.finance/',
  },
  {
    label: 'Analytics',
    href: 'https://duneanalytics.com/naoufel/inverse-dao',
  },
]

export const LandingNav = () => {
  const [showMobileNav, setShowMobileNav] = useState(false)

  return (
    <>
      <Flex width="full" justify="space-between" align="center" p={4} zIndex="docked">
        <Stack direction="row" align="center">
          <Logo boxSize={10} />
          <Text fontWeight="bold" fontSize="lg">
            Inverse
          </Text>
        </Stack>
        <Stack direction="row" spacing={12} fontWeight="semibold" align="center" display={{ base: 'none', md: 'flex' }}>
          {INVERSE_NAV.map(({ label, href }, i) => (
            <Link key={i} fontWeight="medium" href={href}>
              {label}
            </Link>
          ))}
          <Flex w={28}>
            <LinkButton href="/anchor">Enter App</LinkButton>
          </Flex>
        </Stack>
        <Flex display={{ base: 'flex', md: 'none' }} w={6} onClick={() => setShowMobileNav(!showMobileNav)}>
          {showMobileNav ? (
            <Image w={4} h={4} src="/assets/cancel.svg" />
          ) : (
            <Image w={6} h={6} src="/assets/hamburger.svg" />
          )}
        </Flex>
      </Flex>
      <Flex
        w="full"
        opacity={showMobileNav ? 1 : 0}
        position="absolute"
        transitionDuration="0.1s"
        transitionTimingFunction="ease"
      >
        <Stack w="full" bgColor="purple.700" m={2} borderRadius={8} fontWeight="semibold" spacing={6} p={4} pt={16}>
          {INVERSE_NAV.map(({ label, href }, i) => (
            <Link key={i} href={href}>
              {label}
            </Link>
          ))}
          <Link href="/anchor">Enter App</Link>
        </Stack>
      </Flex>
    </>
  )
}

export default LandingNav
