import { Flex, Image, Link, Stack, Text } from '@chakra-ui/react'
import ButtonLink from '@inverse/components/Button'
import Logo from '@inverse/components/Logo'
import { useState } from 'react'
import NextLink from 'next/link'

type NavItem = {
  label: string
  href: string
}

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

export const Navbar = () => {
  const [showMobileNav, setShowMobileNav] = useState(false)

  return (
    <>
      <Flex width="full" justify="space-between" align="center" p={6} zIndex={10}>
        <Stack direction="row" align="center">
          <Logo boxSize={10} />
          <Text fontWeight="bold" fontSize="lg">
            Inverse
          </Text>
        </Stack>
        <Stack direction="row" spacing={12} fontWeight="semibold" align="center" display={{ base: 'none', md: 'flex' }}>
          {INVERSE_NAV.map(({ label, href }) => (
            <NextLink href={href} passHref>
              <Link color="#fff" _hover={{ color: 'purple.100' }} _focus={{}}>
                {label}
              </Link>
            </NextLink>
          ))}
          <Flex w={28}>
            <ButtonLink href="#">Enter App</ButtonLink>
          </Flex>
        </Stack>
        <Flex display={{ base: 'flex', md: 'none' }} onClick={() => setShowMobileNav(!showMobileNav)}>
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
          {INVERSE_NAV.map(({ label, href }: NavItem) => (
            <NextLink href={href} passHref>
              <Link color="#fff" _hover={{ color: 'purple.100' }} _focus={{}}>
                {label}
              </Link>
            </NextLink>
          ))}
          <Text>Enter App</Text>
        </Stack>
      </Flex>
    </>
  )
}

export default Navbar
