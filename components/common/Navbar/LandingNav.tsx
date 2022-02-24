import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import LinkButton from '@app/components/common/Button'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'
import { useState } from 'react'
import { Announcement } from '@app/components/common/Announcement'

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
      <Flex
        width="full"
        bgColor="transparent"
        justify="space-between"
        align="center"
        p={4}
        zIndex="docked"
      >
        <Stack direction="row" align="center">
          <Logo boxSize={10} />
        </Stack>
        <Stack direction="row" spacing={12} fontWeight="semibold" align="center" display={{ base: 'none', md: 'flex' }}>
          {INVERSE_NAV.map(({ label, href }, i) => (
            <Link key={i} fontWeight="medium" href={href} isExternal>
              {label}
            </Link>
          ))}
          <Flex w={28}>
            <LinkButton flexProps={{ bgColor: "primaryPlus" }} href="/anchor">Enter App</LinkButton>
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
        <Stack
          w="full"
          bgColor="primary.900"
          mt={8}
          borderRadius={8}
          fontWeight="semibold"
          spacing={6}
          p={4}
          pt={16}
          borderBottomColor="primary.800"
          borderBottomWidth={1}
          display={showMobileNav ? 'flex' : 'none'}
        >
          {INVERSE_NAV.map(({ label, href }, i) => (
            <Link key={i} href={href} isExternal>
              {label}
            </Link>
          ))}
          <Link href="/anchor">Enter App</Link>
        </Stack>
      </Flex>
      {!showMobileNav && !!process.env.NEXT_PUBLIC_ANNOUNCEMENT_MSG && <Announcement isLanding={true} />}
    </>
  )
}

export default LandingNav
