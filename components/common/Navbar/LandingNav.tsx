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
        py={isBottom ? 0 : '4vh'}
        px={0}
        zIndex="docked"
      >
        <Stack spacing="1vw" direction="row" align="center">
          <Logo boxSize={isBottom ? '3vmax' : '4vmax'} filter={ isBottom ? "brightness(0) invert(1)" : 'unset' } />
          <Text color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor} fontWeight="bold" fontSize="1.5vmax">Inverse Finance</Text>
        </Stack>
        <Stack spacing="2vw" direction="row" fontWeight="semibold" align="center" display={{ base: 'none', md: 'flex' }}>
          {NAV_ITEMS.map(({ label, href }, i) => (
            <Link
              key={i}
              fontWeight="bold"
              href={href}
              isExternal
              color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
              _hover={{ textDecoration: 'underline' }}
              fontSize="1.3vw"
            >
              {label}
            </Link>
          ))}
          <Btn
              href="/firm"
              fontWeight="bold"
              fontSize="1.4vw"
              borderWidth="0.2vmax"
              bgColor={isBottom ? 'transparent' : 'white'}
              h="50px"
              py="1.8vmax"
              px="3vmax"
              transition="transform ease-in-out 200ms"
              _hover={{ transform: 'scale(1.03)' }}
            >
              Enter App
            </Btn>
        </Stack>
      </Flex>
    </>
  )
}

export default LandingNav
