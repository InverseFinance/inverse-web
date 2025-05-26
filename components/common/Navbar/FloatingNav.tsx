import { Box, Image, Popover, SimpleGrid, Stack, Text, VStack, PopoverTrigger, PopoverContent, PopoverBody, useMediaQuery, HStack } from '@chakra-ui/react'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'
import { lightTheme } from '@app/variables/theme';
import { MENUS } from '@app/variables/menus'
import { LandingOutlineButton, LandingSubmitButton } from '../Button/RSubmitButton'
import { biggerSize, slightlyBiggerSize, smallerSize3, smallerSize2, normalSize, slightlyBiggerSize2, smallerSize } from '@app/variables/responsive';
import { SimpleCard } from '../Cards/Simple';
import FirmLogo from '../Logo/FirmLogo';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { LandingBtn, landingMainColor } from '../Landing/LandingComponents';

const GeistText = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
  return <Text fontFamily="Geist" color={mainColor} {...props}>{children}</Text>
}

const NAV_ITEMS = MENUS.nav

const mainColor = "#040826"
const logoBgColor = "#F7F7F7";
const activeCardBgColor = "rgb(235 236 247)";
const inactiveCardBgColor = "white";
const darkNavy = "#5A5D78";

const LANDING_NAV_ITEMS = [
  {
    label: 'Product',
    href: '/firm',
    bigItems: [
      {
        logo: <FirmLogo w="100px" h="auto" theme="light" />,
        title: 'FiRM App',
        text: 'Interact with Inverse Finance in fixed-rate Market',
        href: '/firm',
      },
      {
        logo: <HStack spacing="4">
          <Image borderRadius="full" src="/assets/sDOLAx128.png" alt="sDOLA" w="64px" h="auto" />
          <GeistText color={mainColor} fontSize="20px" fontWeight="bold">sDOLA</GeistText>
        </HStack>,
        title: 'sDOLA',
        text: "The Inverse Finance's yield-bearing stablecoin",
        href: '/sDOLA',
      },
    ]
  },
  {
    label: 'Community',
    href: '/governance',
    mediumItems: [
      {
        logo: <Image src="/assets/landing/discord.svg" alt="Discord" w="64px" h="auto" />,
        title: 'Discord',
        href: 'https://discord.gg/inversefinance',
      },
      {
        logo: <Image src="/assets/landing/x.svg" alt="X" w="64px" h="auto" />,
        title: 'X.com',
        href: 'https://x.com/inversefinance',
      },
      {
        logo: <Image src="/assets/logo.png" alt="Governance" w="64px" h="auto" />,
        title: 'Governance',
        href: 'https://inverse.finance/governance',
      },
    ],
  },
  {
    label: 'Transparency',
    href: '/transparency',
    smallItems: [
      {
        logo: <Image src="/assets/landing/discord.svg" alt="Discord" w="64px" h="auto" />,
        title: 'Treasury',
        href: 'https://inverse.finance/transparency/treasury',
      },
      {
        logo: <Image src="/assets/landing/x.svg" alt="X" w="64px" h="auto" />,
        title: 'Key Metrics',
        href: 'https://inverse.finance/transparency/keymetrics',
      },
      {
        logo: <Image src="/assets/logo.png" alt="Governance" w="64px" h="auto" />,
        title: 'DOLA',
        href: 'https://inverse.finance/transparency/dola',
      },
      {
        logo: <Image src="/assets/landing/discord.svg" alt="Discord" w="64px" h="auto" />,
        title: 'DAO',
        href: 'https://inverse.finance/transparency/dao',
      },
      {
        logo: <Image src="/assets/logo.png" alt="Governance" w="64px" h="auto" />,
        title: 'DBR',
        href: 'https://inverse.finance/transparency/dbr',
      },
      {
        logo: <Image src="/assets/landing/x.svg" alt="X" w="64px" h="auto" />,
        title: 'Docs',
        href: 'https://docs.inverse.finance/inverse-finance',
      },
    ],
  },
]

const BigItem = ({ logo, title, text, href }: { logo: string, title: string, text: string, href: string }) => {
  return (
    <Link href={href} _hover={{}}>
      <SimpleCard cursor="pointer" borderRadius="4px" w='284px' h="230px" p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
        <VStack alignItems="flex-start">
          <VStack alignItems="center" justifyContent="center" w="276px" h="99px" bgColor={logoBgColor} borderRadius="2px" px="2" py="4">
            {logo}
          </VStack>
          <VStack alignItems="flex-start" px="16px" pt="12px" pb="16px">
            <GeistText fontSize="20px" fontWeight="bold">{title}</GeistText>
            <GeistText color={darkNavy} fontSize="16px">{text}</GeistText>
          </VStack>
        </VStack>
      </SimpleCard>
    </Link>
  )
}

const MediumItem = ({ logo, title, text, href }: { logo: string, title: string, text: string, href: string }) => {
  return (
    <Link href={href} _hover={{}}>
      <SimpleCard cursor="pointer" borderRadius="4px" w='186px' h="150px" p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
        <VStack alignItems="center" justifyContent="center">
          <VStack alignItems="center" justifyContent="center" w="178px" h="99px" bgColor={logoBgColor} borderRadius="2px" px="2" py="4">
            {logo}
          </VStack>
          <VStack justifyContent="center" alignItems="center" px="16px">
            <GeistText fontSize="20px" fontWeight="bold">{title}</GeistText>
          </VStack>
        </VStack>
      </SimpleCard>
    </Link>
  )
}

const SmallItem = ({ title, href }: { logo: string, title: string, text: string, href: string }) => {
  return (
    <Link href={href} _hover={{}}>
      <SimpleCard  cursor="pointer" borderRadius="4px" w='200px' h="auto" p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
        <VStack alignItems="center" justifyContent="center">
          <VStack justifyContent="center" alignItems="flex-start" px="16px">
            <GeistText py="4" fontSize="16px" fontWeight="bold">{title}</GeistText>
          </VStack>
        </VStack>
      </SimpleCard>
    </Link>
  )
}

export const FloatingNav = ({
  isBottom = false
}: {
  isBottom?: boolean
}) => {
  const [isLargerThan] = useMediaQuery('(min-width: 1330px)');
  return (
    <>
      <SimpleGrid
        columns={3}
        width="full"
        bgColor="white"
        justifyContent="space-between"
        alignItems="center"
        py={2}
        px={'1%'}
        zIndex="docked"
        borderRadius="5px"
      >
        <Stack alignItems="center" spacing={{ base: '2', '2xl': '1vw' }} direction="row" align="center">
          <Logo minH="30px" minW="30px" boxSize={isBottom ? '1.8vmax' : '3.8vmax'} filter={isBottom ? "brightness(0) invert(1)" : 'unset'} />
          <Text display={{ base: 'none', 'md': 'block' }} className="landing-v3-text" as={isBottom ? 'h3' : 'h1'} color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
            fontSize={isBottom ? normalSize : slightlyBiggerSize}
          >
            <b>Inverse</b> Finance
          </Text>
        </Stack>
        <Stack spacing="8" direction="row" justifyContent="center" fontWeight="semibold" alignItems="center" display={{ base: 'none', lg: 'flex' }}>
          {LANDING_NAV_ITEMS.map(({ label, href, bigItems, mediumItems, smallItems }, i) => (
            <Box
              key={i}
              href={href}
              fontWeight="medium"
              position="relative"
            >
              <Popover trigger="hover">
                <PopoverTrigger>
                  <Box>
                    <Link
                      fontSize={isLargerThan ? '18px' : '15px'}
                      color={mainColor}
                      _hover={{ color: mainColor }}
                      href={href}
                      whiteSpace="nowrap"
                      >
                      {label} <ChevronDownIcon />
                    </Link>
                  </Box>
                </PopoverTrigger>
                {
                  bigItems?.length > 0 &&
                  <PopoverContent pt="20px" w="fit-content" h="239px" background={'transparent'} border="none">
                    <PopoverBody p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
                      <SimpleGrid w='full' columns={2} spacing="2">
                        {
                          bigItems
                            ?.map(s => {
                              return <BigItem key={s.title} {...s} />
                            })
                        }
                      </SimpleGrid>
                    </PopoverBody>
                  </PopoverContent>
                }
                {
                  mediumItems?.length > 0 &&
                  <PopoverContent pt="20px" w="fit-content" h="187px" background={'transparent'} border="none">
                    <PopoverBody p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
                      <SimpleGrid justifyContent="space-between" w='full' columns={3} spacing="2">
                        {
                          mediumItems
                            ?.map(s => {
                              return <MediumItem key={s.title} {...s} />
                            })
                        }
                      </SimpleGrid>
                    </PopoverBody>
                  </PopoverContent>
                }
                {
                  smallItems?.length > 0 &&
                  <PopoverContent pt="20px" w="fit-content" h="187px" background={'transparent'} border="none">
                    <PopoverBody p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
                      <SimpleGrid justifyContent="space-between" w='full' columns={2} spacing="2">
                        {
                          smallItems
                            ?.map(s => {
                              return <SmallItem key={s.title} {...s} />
                            })
                        }
                      </SimpleGrid>
                    </PopoverBody>
                  </PopoverContent>
                }
              </Popover>
            </Box>
          ))}
        </Stack>
        <VStack alignItems="flex-end">
          <LandingBtn
            color={landingMainColor}
            href="/firm"
            className="landing-v3-text"
            fontWeight="bold"
            borderRadius="4px"
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
            w='150px'
            h="40px"
            fontSize={isLargerThan ? '18px' : '15px'}
          >
            Launch App
          </LandingBtn>
        </VStack>
      </SimpleGrid>
    </>
  )
}

export default FloatingNav
