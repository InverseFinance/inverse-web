import { Flex, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'
import { lightTheme } from '@app/variables/theme';
import { MENUS } from '@app/variables/menus'
import { LandingOutlineButton, LandingSubmitButton } from '../Button/RSubmitButton'
import { biggerSize, slightlyBiggerSize, smallerSize3, smallerSize2, normalSize, slightlyBiggerSize2, smallerSize } from '@app/variables/responsive';

const NAV_ITEMS = MENUS.nav

const LANDING_NAV_ITEMS = [
  {
    label: 'Product',
    href: '/firm',
  },
  {
    label: 'Transparency',
    href: '/transparency',
  },
  {
    label: 'Community',
    href: '/governance',
  },
]

export const FloatingNav = ({
  isBottom = false
}: {
  isBottom?: boolean
}) => {
  const Btn = isBottom ? LandingSubmitButton : LandingOutlineButton;
  return (
    <>
      <SimpleGrid
        columns={3}
        width="full"
        bgColor="white"
        justifyContent="space-between"
        alignItems="center"
        py={2}
        px={2}
        zIndex="docked"
        borderRadius="5px"
      >
        <Stack alignItems="center" spacing={{ base: '2', '2xl': '1vw' }} direction="row" align="center">
          <Logo minH="30px" minW="30px" boxSize={isBottom ? '1.8vmax' : '3.8vmax'} filter={isBottom ? "brightness(0) invert(1)" : 'unset'} />
          <Text className="landing-v3-text" as={isBottom ? 'h3' : 'h1'} color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
            fontSize={isBottom ? normalSize : slightlyBiggerSize}
          >
            <b>Inverse</b> Finance
          </Text>
        </Stack>
        <Stack spacing="8" direction="row" justifyContent="center" fontWeight="semibold" alignItems="center" display={{ base: 'none', lg: 'flex' }}>
          {LANDING_NAV_ITEMS
            .map(({ label, href }, i) => (
              <Link
                key={i}
                fontWeight="bold"
                href={href}
                isExternal
                color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
                _hover={{ textDecoration: 'underline' }}
                fontSize={smallerSize3}
                className="landing-v3-text"
              >
                {label}
              </Link>
            ))}
        </Stack>
        <VStack alignItems="flex-end">
          <Btn
            href="/firm"
            className="landing-v3-text"
            fontWeight="bold"
            // fontSize={slightlyBiggerSize}
            outline={isBottom ? '2px solid white' : `2px solid ${lightTheme.colors.mainTextColor}`}
            bgColor={isBottom ? 'transparent' : 'white'}
            // h="50px"
            // py="2.2vmax"
            // px="3vmax"
            py="2"
            // py={{ base: '26px', '2xl': '36px', '3xl': '40px', '4xl': '48px' }}
            transition="transform ease-in-out 200ms"
            _hover={{ transform: 'scale(1.03)' }}
            maxW={{ base: '145px', '2xl': 'none' }}
            fontSize={smallerSize2}
          >
            Launch App
          </Btn>
        </VStack>
      </SimpleGrid>
    </>
  )
}

export default FloatingNav
