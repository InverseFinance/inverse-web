import { Flex, Stack, Text } from '@chakra-ui/react'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'
import { lightTheme } from '@app/variables/theme';
import { MENUS } from '@app/variables/menus'
import { LandingOutlineButton, LandingSubmitButton } from '../Button/RSubmitButton'
import { biggerSize, slightlyBiggerSize, smallerSize3, smallerSize2, normalSize, slightlyBiggerSize2, smallerSize } from '@app/variables/responsive';

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
        <Stack alignItems="center" spacing={{ base: '2', '2xl': '1vw' }} direction="row" align="center">
          <Logo minH="30px" minW="30px" boxSize={isBottom ? '1.8vmax' : '3.8vmax'} filter={isBottom ? "brightness(0) invert(1)" : 'unset'} />
          <Text as={isBottom ? 'h3' : 'h1'} color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
            fontWeight="bold"
            fontSize={isBottom ? normalSize : slightlyBiggerSize}
            fontFamily="Inter !important"
          >
            Inverse Finance
          </Text>
        </Stack>
        <Stack spacing="1.4vw" direction="row" fontWeight="semibold" align="center" display={{ base: 'none', lg: 'flex' }}>
          {NAV_ITEMS
            .filter(({ label }) => label !== 'More')
            .map(({ label, href }, i) => (
              <Link
                key={i}
                fontWeight="bold"
                href={href}
                isExternal
                color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
                _hover={{ textDecoration: 'underline' }}
                fontSize={smallerSize3}
              >
                {label}
              </Link>
            ))}
          <Btn
            href="/firm"
            fontWeight="bold"
            // fontSize={slightlyBiggerSize}
            outline={isBottom ? '2px solid white' : `2px solid ${lightTheme.colors.mainTextColor}`}
            bgColor={isBottom ? 'transparent' : 'white'}
            // h="50px"
            // py="2.2vmax"
            // px="3vmax"
            py={{ base: '26px', '2xl': '36px', '3xl': '40px', '4xl': '48px' }}
            transition="transform ease-in-out 200ms"
            _hover={{ transform: 'scale(1.03)' }}
            maxW={{ base: '145px', '2xl': 'none' }}
            fontSize={smallerSize2}
          >
            Enter App
          </Btn>
        </Stack>
      </Flex>
    </>
  )
}

export default LandingNav
