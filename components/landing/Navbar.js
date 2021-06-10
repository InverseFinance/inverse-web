import { Flex, Image, Stack, Text } from '@chakra-ui/react'
import Button from '@inverse/components/landing/Button'
import Logo from '@inverse/components/landing/Logo'
import { useState } from 'react'

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
        <Stack
          direction="row"
          spacing={12}
          fontWeight="semibold"
          align="center"
          display={{ base: 'none', md: 'flex' }}>
          <Text>Docs</Text>
          <Text>Analytics</Text>
          <Flex w={28}>
            <Button>Enter App</Button>
          </Flex>
        </Stack>
        <Flex
          display={{ base: 'flex', md: 'none' }}
          onClick={() => setShowMobileNav(!showMobileNav)}>
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
        transitionTimingFunction="ease">
        <Stack
          w="full"
          bgColor="purple.700"
          m={2}
          borderRadius={8}
          fontWeight="semibold"
          spacing={6}
          p={4}
          pt={16}>
          <Text>Docs</Text>
          <Text>Analytics</Text>
          <Text>Enter App</Text>
        </Stack>
      </Flex>
    </>
  )
}

export default Navbar
