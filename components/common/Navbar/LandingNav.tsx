import { Flex, Stack, Text } from '@chakra-ui/react'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'
import { lightTheme } from '@app/variables/theme';
import { MENUS } from '@app/variables/menus'
import { LandingOutlineButton, LandingSubmitButton } from '../Button/RSubmitButton'

const NAV_ITEMS = MENUS.nav

export const LandingNav = ({
  isBottom = false
}: {
  isBottom?: boolean
}) => {
  const Btn = isBottom ? LandingSubmitButton : LandingOutlineButton;
  return (
    <>
      <Flex
        width="full"
        bgColor="transparent"
        justify="space-between"
        align="center"
        py={isBottom ? 0 : 4}
        px={0}
        zIndex="docked"
      >
        <Stack spacing="3" direction="row" align="center">
          <Logo boxSize={isBottom ? 30 : 50} filter={ isBottom ? "brightness(0) invert(1)" : 'unset' } />
          <Text color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor} fontWeight="bold" fontSize="18px">Inverse Finance</Text>
        </Stack>
        <Stack spacing="6" direction="row" fontWeight="semibold" align="center" display={{ base: 'none', md: 'flex' }}>
          {NAV_ITEMS.map(({ label, href }, i) => (
            <Link
              key={i}
              fontWeight="bold"
              href={href}
              isExternal
              color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
              _hover={{ textDecoration: 'underline' }}
            >
              {label}
            </Link>
          ))}
          <Flex w={28}>
            <Btn
              href="/firm"
              fontWeight="bold"
              fontSize="16px"
              borderWidth="2px"
              bgColor={isBottom ? 'transparent' : 'white'}
              h="50px"
              transition="transform ease-in-out 200ms"
              _hover={{ transform: 'scale(1.03)' }}
            >
              Enter App
            </Btn>
          </Flex>
        </Stack>
      </Flex>
    </>
  )
}

export default LandingNav
