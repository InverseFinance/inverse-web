import { Flex, HStack, Image, UnorderedList, ListItem, Stack, Text, SimpleGrid, StackProps, Divider, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { LandingNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { lightTheme } from '@app/variables/theme'
import { SplashedText } from '@app/components/common/SplashedText'
import { LandingOutlineButton, LandingSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { SimpleCard } from '@app/components/common/Cards/Simple'
import { shortenNumber } from '@app/util/markets'
import { getLandingProps } from '@app/blog/lib/utils'
import LightPostPreview from '@app/blog/components/light-post-preview'
import { Ecosystem } from '@app/components/Landing/Ecosystem'
import { biggestSize, smallerSize, biggerSize, normalSize, btnIconSize, smallerSize2, slightlyBiggerSize2 } from '@app/variables/responsive'
import { ArrowForwardIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { BurgerMenu } from '@app/components/common/Navbar/BurgerMenu'
import { MENUS } from '@app/variables/menus'
import { LandingAnimation, LandingAnimation2 } from '@app/components/common/Animation/LandingAnimation'
import FloatingNav from '@app/components/common/Navbar/FloatingNav'
import { EcosystemBanner } from '@app/components/Landing/EcosystemBanner'
import { InfoMessage, Message } from '@app/components/common/Messages'
import Link from '@app/components/common/Link'
import { useEffect } from 'react'

const ResponsiveStack = (props: StackProps) => <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" {...props} />

const mainColor = "#040826"
const mutedColor = "#5A5D78"
const yellowColor = "#FFF6B6"

const purple = "#B69AFF"
const purpleText = "#581EF4"

const Stat = ({ value, name }: { value: number, name: string }) => {
  return <VStack alignItems="flex-start" justifyContent="center" w="full">
    <Text fontFamily="Geist" color={mutedColor} fontSize={smallerSize}>{name}</Text>
    <Text fontFamily="Geist" color={mainColor} fontSize={smallerSize} fontWeight="bold">{value}</Text>
  </VStack>
}

const StatBasic = ({ value, name, ...props }: { value: number, name: string, props?: any }) => {
  return <VStack w='full' px="4" py="4" alignItems="flex-start" {...props}>
    <Heading alignSelf="flex-start" color={lightTheme.colors.mainTextColor} fontSize={biggestSize} fontWeight="bold">{value}</Heading>
    <Heading alignSelf="flex-start" color={lightTheme.colors.mainTextColor} fontSize={smallerSize}>{name}</Heading>
  </VStack>
}

const Heading = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
  return <Text color="#040826" className="landing-v3-heading" fontSize="3xl" fontWeight="bold" {...props}>{children}</Text>
}

const Card = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
  return <SimpleCard boxShadow="0 4px 5px 5px #33333322" borderRadius="2px" py="4" {...props}>{children}</SimpleCard>
}

const GeistText = ({ children, ...props }: { children: React.ReactNode, props?: any }) => {
  return <Text fontFamily="Geist" color={mainColor} {...props}>{children}</Text>
}

const LandingBtn = ({ children, ...props }: { children: React.ReactNode, props?: any }) => <LandingSubmitButton fontFamily="Geist" bgColor={mainColor} w={{ base: 'full', sm: 'auto' }} {...props}>{children}</LandingSubmitButton>

const LandingLink = ({ children, ...props }: { children: React.ReactNode, props?: any }) => <Link _hover={{ color: mainColor, textDecoration: 'underline' }} fontFamily="Geist" color={mainColor} {...props}>{children}</Link>

export const Landing = ({
  posts,
  currentCirculatingSupply,
  dbrPriceUsd,
  firmTotalTvl,
  invPrice,
  dolaPrice,
  apy,
  projectedApy,
  dolaVolume,
  totalDebt,
}: {
  posts: any[],
  currentCirculatingSupply: number,
  dbrPriceUsd: number,
  firmTotalTvl: number,
  dolaPrice: number,
  invPrice: number,
  dolaVolume: number,
  apy: number,
  projectedApy: number,
  totalDebt: number,
}) => {
  const stats = [
    {
      name: 'sDOLA APY',
      value: `${shortenNumber(apy, 2, false)}%`,
    },
    {
      name: 'TVL',
      value: firmTotalTvl ? shortenNumber(firmTotalTvl, 2, false) : '-',
    },
    {
      name: 'DOLA Circulation',
      value: shortenNumber(currentCirculatingSupply, 2, true),
    },
    {
      name: 'FiRM Borrows',
      value: shortenNumber(totalDebt, 2, true),
    },
    // {
    //   name: 'DOLA 24h Vol.',
    //   value: dolaVolume,
    // },
    // {
    //   name: 'INV price',
    //   value: invPrice,
    // },
    // {
    //   name: 'DBR price',
    //   value: dbrPriceUsd ? dbrPriceUsd : '-',
    // },
  ]

  const audits = [
    {
      name: 'External Audits',
      value: 3,
    },
    {
      name: 'DefiSafety Score',
      value: '87%',
    },
  ];

  useEffect(() => {
    const sectionFirm1 = document.getElementById('section-firm-1')
    const sectionFirm2 = document.getElementById('section-firm-2')
    const height = sectionFirm2?.clientHeight
    if (sectionFirm1 && height) {
      sectionFirm1.style.height = `${height}px`
    }
  }, [])

  return (
    <Layout isLanding={true} pt="0" overflow="hidden">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Geist:wght@100..900&display=swap" rel="stylesheet"></link>
        <title>Inverse Finance - Fixed-Rate DeFi borrowing</title>
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/landing.png" />
        <link rel="canonical" href="https://inverse.finance" />
        <link rel="stylesheet" href="/landing.css" />
      </Head>
      <VStack spacing="0" className="landing-v3" w='full' alignItems="flex-start">
        <VStack h='100vh' w='full'>
          <VStack bgImage="/assets/landing/anim_bg.png" zIndex="-1" position="fixed" top="0" left="0" height="100vh" width="100%">
            <LandingAnimation loop={true} height="100%" width="100%" />
          </VStack>
          <VStack maxW="1300px" w='full' px="4%" py="5" alignItems="center">
            <FloatingNav />
          </VStack>
          <VStack pt="8" spacing="8" w='full' alignItems="center">
            <VStack spacing="0" w='full' alignItems="center">
              <Heading textAlign="center" whiteSpace="pre-line" as="h1" fontSize="6xl" fontWeight="bold">
                Experience Fixed Rates
                <br />
                With Unfixed Potential Today
              </Heading>
            </VStack>
            <GeistText as="h2" fontSize="xl">
              Stack your leverage with locked rates and multiply your returns - all in one click
            </GeistText>
            <LandingBtn href="/firm">
              Launch App
            </LandingBtn>
            <Card mt="12" w="full" maxW="800px">
              <SimpleGrid columns={{ base: 2, md: 4 }} gap="2" w="full">
                {
                  stats.map((stat) => (
                    <Stat key={stat.name} {...stat} />
                  ))
                }
              </SimpleGrid>
            </Card>
          </VStack>
        </VStack>
        {/* below fold */}
        <VStack w='full' bg="linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 80%);" pt="100px">
          <Heading textAlign="center" whiteSpace="pre-line" as="h1" fontSize="3xl" fontWeight="bold">
            Trusted by the Best
          </Heading>
          <GeistText fontSize="md">
            Inverse Finance has been trusted by Top DeFi protocols
          </GeistText>
        </VStack>
        <VStack w='full' bg="white" py="20">
          <EcosystemBanner />
        </VStack>
        <VStack alignItems="flex-start" bgColor={yellowColor} w='full' py="8" px="10">
          <Heading textAlign="flex-start" fontSize="5xl" fontWeight="extrabold">
            Lock in. Dream Bigger.
          </Heading>
        </VStack>
        <ResponsiveStack spacing="0" bgColor="white" w='full' alignItems="flex-start">
          <VStack  id="section-firm-1" w='50%' bgImage="/assets/landing/firm-ui-sample.png" bgSize="cover" bgRepeat="no-repeat" bgPosition="center" h="476px">
          </VStack>
          <VStack id="section-firm-2" borderLeft="0px solid #B6B6B6" alignItems="flex-start" spacing="0" w='50%' px="0" py="0">
            <VStack alignItems="flex-start" spacing="0" pt="4">
              <VStack px="4" alignItems="flex-start" spacing="4">
                <HStack px="4" py="2" alignItems="center" borderRadius="20px" gap="2" bgColor={purple}>
                  <Image src="/assets/landing/safeguarded.png" alt="Safeguarded" w="14px" h="14px" />
                  <GeistText color={purpleText} fontSize="md">
                    Safeguarded with on-chain monitoring
                  </GeistText>
                </HStack>
                <GeistText fontSize="md">
                  Whether it's longing ETH, looping LP tokens, or just borrowing at size, break free from the drag of unpredictable interest rates
                </GeistText>
                <VStack py="4">
                  <HStack spacing="8">
                    <LandingBtn href="/firm">
                      Try It Out Now
                    </LandingBtn>
                    <LandingLink href="https://docs.inverse.finance">
                      Read Docs <ArrowForwardIcon />
                    </LandingLink>
                  </HStack>
                </VStack>
              </VStack>
              <HStack alignItems="center" justifyContent="space-evenly" borderTop="1px solid #B6B6B6" w="full">
                <StatBasic borderRight="1px solid #B6B6B6" value={shortenNumber(firmTotalTvl, 2, true)} name="TVL" />
                <StatBasic value={`${shortenNumber(dbrPriceUsd * 100, 2, false)}%`} name="Fixed Rate" />
              </HStack>
              <HStack p="4" alignItems="flex-start" borderTop="1px solid #B6B6B6" w="full">
                <Image mt="2" src="/assets/landing/one-click.png" alt="One-Click Hyperleverage" w="30px" h="30px" />
                <VStack alignItems="flex-start">
                  <Heading>
                    One-Click Hyperleverage
                  </Heading>
                  <GeistText>
                    Turbocharge yield-bearing assets while keeping full control of your collateral—never loaned out, always yours.
                  </GeistText>
                </VStack>
              </HStack>
            </VStack>
          </VStack>
        </ResponsiveStack>
      </VStack>
    </Layout>
  )
}

export default Landing;

export async function getServerSideProps(context) {
  context.res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return { ...await getLandingProps(context) }
}
