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
import { TOKEN_IMAGES } from '@app/variables/images';
import { LandingBurgerMenu } from './LandingBurgerMenu';

const GeistText = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
  return <Text fontFamily="Geist" color={mainColor} {...props}>{children}</Text>
}

const mainColor = "#040826"
const logoBgColor = "#F7F7F7";
const activeCardBgColor = "rgb(235 236 247)";
const inactiveCardBgColor = "white";
const darkNavy = "#5A5D78";

const LANDING_NAV_ITEMS = [
  {
    label: 'Product',
    href: '/firm',
    type: 'big',
    submenus: [
      {
        logo: <FirmLogo w="100px" h="auto" theme="light" />,
        title: 'FiRM App',
        text: 'Interact with Inverse Finance in fixed-rate Market',
        href: '/firm',
      },
      {
        logo: <HStack spacing="4">
          <Image borderRadius="full" src="/assets/sDOLAx128.png" alt="sDOLA" w="64px" h="auto" />
          {/* <GeistText color={mainColor} fontSize="20px" fontWeight="bold">sDOLA</GeistText> */}
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
    type: 'medium',
    submenus: [
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
    type: 'small',
    submenus: [
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

export const LandingBigItem = ({ logo, title, text, href }: { logo: string, title: string, text: string, href: string }) => {
  return (
    <Link href={href} _hover={{}}>
      <SimpleCard alignItems="center" cursor="pointer" borderRadius="4px" w={{ base: 'full', md: '284px' }} h={{ base: 'auto', md: '230px' }} p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
        <Stack direction={{ base: 'row', md: 'column' }} alignItems={{ base: 'center', md: 'flex-start' }}>
          <VStack alignItems="center" justifyContent="center" minW={{ base: '99px', md: '276px' }} minH={{ base: '94px', md: '99px' }} bgColor={logoBgColor} borderRadius="2px" px="2" py={{ base: '0', md: '4' }}>
            {logo}
          </VStack>
          <VStack alignItems="flex-start" px="16px" pt="12px" pb="16px">
            <GeistText fontSize={{ base: '16px', md: '20px' }} fontWeight="bold">{title}</GeistText>
            <GeistText color={darkNavy} fontSize={{ base: '14px', md: '16px' }}>{text}</GeistText>
          </VStack>
        </Stack>
      </SimpleCard>
    </Link>
  )
}

export const LandingMediumItem = ({ logo, title, text, href }: { logo: string, title: string, text: string, href: string }) => {
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

export const LandingSmallItem = ({ title, href }: { logo: string, title: string, text: string, href: string }) => {
  return (
    <Link href={href} _hover={{}}>
      <SimpleCard cursor="pointer" borderRadius="4px" w='200px' h="auto" p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
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
  const [isSmallerThan] = useMediaQuery('(max-width: 728px)');
  return (
    <>
      <SimpleGrid
        bg="linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 0.8) 2%, rgba(255, 255, 255, 1) 98%, rgba(0, 0, 0, 0.05) 100%)"
        borderRadius={{ base: 0, md: '4px' }}
        boxShadow="unset"
        w="full"
        columns={{ base: 2, md: 3 }}
        width="full"
        bgColor="white"
        justifyContent="space-between"
        alignItems="center"
        py={2}
        px={{ base: 4, md: '1%' }}
        zIndex="docked"
      >
        <Stack alignItems="center" spacing={{ base: '2', '2xl': '1vw' }} direction="row" align="center">
          {
            isSmallerThan ? <Image src={TOKEN_IMAGES.INV} w="30px" h="30px" borderRadius="full" /> : <Logo minH="30px" minW="30px" boxSize={isBottom ? '1.8vmax' : '3.8vmax'} filter={isBottom ? "brightness(0) invert(1)" : 'unset'} />
          }
          <Text display={{ base: 'none', 'md': 'block' }} className="landing-v3-text" as={isBottom ? 'h3' : 'h1'} color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
            fontSize={isBottom ? normalSize : slightlyBiggerSize}
          >
            <b>Inverse</b> Finance
          </Text>
        </Stack>
        <Stack spacing="8" direction="row" justifyContent="center" fontWeight="semibold" alignItems="center" display={{ base: 'none', lg: 'flex' }}>
          {LANDING_NAV_ITEMS.map(({ label, href, submenus, type }, i) => (
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
                  submenus?.length > 0 && type === 'big' &&
                  <PopoverContent pt="20px" w="fit-content" h="239px" background={'transparent'} border="none">
                    <PopoverBody p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
                      <SimpleGrid w='full' columns={2} spacing="2">
                        {
                          submenus
                            ?.map(s => {
                              return <LandingBigItem key={s.title} {...s} />
                            })
                        }
                      </SimpleGrid>
                    </PopoverBody>
                  </PopoverContent>
                }
                {
                  submenus?.length > 0 && type === 'medium' &&
                  <PopoverContent pt="20px" w="fit-content" h="187px" background={'transparent'} border="none">
                    <PopoverBody p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
                      <SimpleGrid justifyContent="space-between" w='full' columns={3} spacing="2">
                        {
                          submenus
                            ?.map(s => {
                              return <LandingMediumItem key={s.title} {...s} />
                            })
                        }
                      </SimpleGrid>
                    </PopoverBody>
                  </PopoverContent>
                }
                {
                  submenus?.length > 0 && type === 'small' &&
                  <PopoverContent pt="20px" w="fit-content" h="187px" background={'transparent'} border="none">
                    <PopoverBody p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
                      <SimpleGrid justifyContent="space-between" w='full' columns={2} spacing="2">
                        {
                          submenus
                            ?.map(s => {
                              return <LandingSmallItem key={s.title} {...s} />
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
        <HStack alignItems="center" justifyContent="flex-end" spacing="8">
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
          {isSmallerThan && <LandingBurgerMenu isLanding={true} navItems={LANDING_NAV_ITEMS} /> }
        </HStack>
      </SimpleGrid>
    </>
  )
}

export default FloatingNav
