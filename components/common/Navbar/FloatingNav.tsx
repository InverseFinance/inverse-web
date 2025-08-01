import { Box, Image, Popover, SimpleGrid, Stack, Text, VStack, PopoverTrigger, PopoverContent, PopoverBody, useMediaQuery, HStack } from '@chakra-ui/react'
import Link from '@app/components/common/Link'
import Logo from '@app/components/common/Logo'
import { lightTheme } from '@app/variables/theme';
import { slightlyBiggerSize, normalSize } from '@app/variables/responsive';
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
        title: 'FiRM',
        text: 'Borrow for any duration at fixed rates',
        href: '/firm',
      },
      {
        logo: <HStack spacing="4">
          <Image borderRadius="full" src="/assets/sDOLAx128.png" alt="sDOLA" w="64px" h="auto" />
          {/* <GeistText color={mainColor} fontSize="20px" fontWeight="bold">sDOLA</GeistText> */}
        </HStack>,
        title: 'sDOLA',
        text: "Inverse Finance's yield-bearing stablecoin",
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
        logo: <Image src="/assets/landing/discord.svg" alt="Discord" w={{ base: '32px', md: '64px' }} h="auto" />,
        title: 'Discord',
        href: 'https://discord.gg/YpYJC7R5nv',
      },
      {
        logo: <Image src="/assets/landing/x.svg" alt="X" w={{ base: '32px', md: '64px' }} h="auto" />,
        title: 'X.com',
        href: 'https://x.com/inversefinance',
      },
      {
        logo: <Image src="/assets/logo.png" alt="Governance" w={{ base: '32px', md: '64px' }} h="auto" />,
        title: 'Governance',
        href: '/governance',
      },
    ],
  },
  {
    label: 'Transparency',
    href: '/transparency',
    type: 'small',
    submenus: [
      {
        logo: <Image src="/assets/landing/transparency/dola.svg" alt="DOLA" w="20px" h="20px" />,
        title: 'DOLA',
        href: '/transparency/dola',
      },
      {
        logo: <Image src="/assets/landing/transparency/dbr.svg" alt="DBR" w="20px" h="20px" />,
        title: 'DBR',
        href: '/transparency/dbr',
      },
      {
        logo: <Image src="/assets/landing/transparency/treasury.svg" alt="Treasury" w="20px" h="20px" />,
        title: 'Treasury',
        href: '/transparency/treasury',
      },
      {
        logo: <Image src="/assets/landing/transparency/keymetrics.svg" alt="Keymetrics" w="20px" h="20px" />,
        title: 'Key Metrics',
        href: '/transparency/keymetrics',
      },

      {
        logo: <Image src="/assets/landing/transparency/dao.svg" alt="DAO" w="20px" h="20px" />,
        title: 'DAO',
        href: '/transparency/dao',
      },

      {
        logo: <Image src="/assets/landing/transparency/docs.svg" alt="Docs" w="20px" h="20px" />,
        title: 'Docs',
        href: 'https://docs.inverse.finance/inverse-finance',
      },
    ],
  },
]

export const LandingBigItem = ({ logo, title, text, href }: { logo: string, title: string, text: string, href: string }) => {
  return (
    <Link href={href} _hover={{}}>
      <SimpleCard boxShadow="0 1px 1px 1px #00000011" alignItems="center" cursor="pointer" borderRadius="4px" w={{ base: 'full', md: '284px' }} h={{ base: 'auto', md: '230px' }} p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
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

export const LandingMediumItem = ({ logo, title, text, href, width }: { logo: string, title: string, text: string, href: string, width?: string }) => {
  return (
    <Link width={width} href={href} _hover={{}}>
      <SimpleCard alignItems="center" boxShadow="0 1px 1px 1px #00000011" cursor="pointer" borderRadius="4px" w={{ base: '100px', md: '186px' }} h={{ base: '100px', md: '150px' }} p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
        <VStack w='full' alignItems="center" justifyContent="center">
          <VStack alignItems="center" justifyContent="center" w={{ base: '90px', md: '178px' }} h={{ base: '50px', md: '99px' }} bgColor={logoBgColor} borderRadius="2px" px="2" py="4">
            {logo}
          </VStack>
          <VStack justifyContent="center" alignItems="center" px="16px">
            <GeistText fontSize={{ base: '14px', md: '20px' }} fontWeight="bold">{title}</GeistText>
          </VStack>
        </VStack>
      </SimpleCard>
    </Link>
  )
}

export const LandingSmallItem = ({ title, href, logo }: { logo: string, title: string, text: string, href: string }) => {
  return (
    <Link href={href} _hover={{}} w='full'>
      <SimpleCard boxShadow="0 1px 1px 1px #00000011" cursor="pointer" borderRadius="4px" w='full' h="auto" p="1" bgColor={inactiveCardBgColor} _hover={{ bgColor: activeCardBgColor }}>
        <HStack spacing="4" alignItems="center" justifyContent="flex-start" w='full'>
          <VStack alignItems="center" justifyContent="center" w="50px" h="50px" bgColor={logoBgColor} borderRadius="2px" p="0">
            {logo}
          </VStack>
          <VStack justifyContent="center" alignItems="flex-start" pl="0" pr="4">
            <GeistText py="2" fontSize="16px" fontWeight="bold">{title}</GeistText>
          </VStack>
        </HStack>
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
  const [isSmallerThan] = useMediaQuery('(max-width: 1024px)');
  return (
    <>
      <SimpleGrid
        // bg="linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 0.8) 2%, rgba(255, 255, 255, 1) 98%, rgba(0, 0, 0, 0.05) 100%)"
        bgColor='#fdfdfe'
        bg="linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(250, 250, 250, 0.8) 2%, rgba(255, 255, 255, 1) 98%, rgba(0, 0, 0, 0.05) 100%)"
        borderRadius={{ base: 0, md: '4px' }}
        boxShadow="unset"
        w="full"
        columns={{ base: 2, lg: 3 }}
        width="full"
        bgColor="white"
        justifyContent="space-between"
        alignItems="center"
        py={2}
        px={{ base: 4, lg: '1%' }}
        zIndex="2"
      >
        <Stack alignItems="center" spacing={{ base: '2', '2xl': '1vw' }} direction="row" align="center">
          <Link href="/" _hover={{}}>
            {
              isSmallerThan ? <Image src={TOKEN_IMAGES.INV} w="30px" h="30px" borderRadius="full" /> : <Logo minH="30px" minW="30px" boxSize={isBottom ? '1.8vmax' : '3.8vmax'} filter={isBottom ? "brightness(0) invert(1)" : 'unset'} />
            }
          </Link>
          <Link href="/" _hover={{}}>
            <Text display={{ base: 'none', 'md': 'block' }} className="landing-v3-text" as={isBottom ? 'h3' : 'h2'} color={isBottom ? lightTheme.colors.contrastMainTextColor : lightTheme.colors.mainTextColor}
              fontSize={isBottom ? normalSize : slightlyBiggerSize}
            >
              <b>Inverse</b> Finance
            </Text>
          </Link>
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
                    <Text
                      fontSize={isLargerThan ? '18px' : '15px'}
                      color={mainColor}
                      _hover={{ color: mainColor }}
                      whiteSpace="nowrap"
                    >
                      {label} <ChevronDownIcon />
                    </Text>
                  </Box>
                </PopoverTrigger>
                {
                  submenus?.length > 0 && type === 'big' &&
                  <PopoverContent pt="20px" w="fit-content" h="239px" background={'transparent'} border="none">
                    <PopoverBody boxShadow="0 1px 1px 1px #00000011" p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
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
                    <PopoverBody boxShadow="0 1px 1px 1px #00000011" p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
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
                    <PopoverBody boxShadow="0 1px 1px 1px #00000011" p="2" className={`blurred-container light-bg compat-mode2`} borderRadius="4px">
                      <VStack alignItems="flex-start" w='full' spacing="1">
                        {
                          submenus
                            ?.map(s => {
                              return <LandingSmallItem key={s.title} {...s} />
                            })
                        }
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                }
              </Popover>
            </Box>
          ))}
        </Stack>
        <HStack alignItems="center" justifyContent="flex-end" spacing="8">
          <Link href="/firm">
            <LandingBtn
              color={landingMainColor}
              className="landing-v3-text"
              fontWeight="bold"
              borderRadius="4px"
              // fontSize={slightlyBiggerSize}
              outline={isBottom ? '2px solid white' : `1px solid ${lightTheme.colors.mainTextColor}`}
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
          </Link>
          {isSmallerThan && <LandingBurgerMenu isLanding={true} navItems={LANDING_NAV_ITEMS} />}
        </HStack>
      </SimpleGrid >
    </>
  )
}

export default FloatingNav
