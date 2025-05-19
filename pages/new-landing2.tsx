import { Flex, HStack, Image, UnorderedList, ListItem, Stack, Text, VStack, SimpleGrid, StackProps, Divider } from '@chakra-ui/react'
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
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { BurgerMenu } from '@app/components/common/Navbar/BurgerMenu'
import { MENUS } from '@app/variables/menus'
import { LandingAnimation, LandingAnimation2 } from '@app/components/common/Animation/LandingAnimation'
import FloatingNav from '@app/components/common/Navbar/FloatingNav'

const ResponsiveStack = (props: StackProps) => <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" {...props} />

const Stat = ({ value, name }: { value: number, name: string }) => {
  return <VStack>
    <Text color={lightTheme.colors.mainTextColor} fontSize={biggestSize} fontWeight="bold">{shortenNumber(value, 2, true)}</Text>
    <Text color={lightTheme.colors.mainTextColor} fontSize={smallerSize}>{name}</Text>
  </VStack>
}

const StatBasic = ({ value, name }: { value: number, name: string }) => {
  return <VStack>
    <Text color={lightTheme.colors.mainTextColor} fontSize={biggestSize} fontWeight="bold">{value}</Text>
    <Text color={lightTheme.colors.mainTextColor} fontSize={smallerSize}>{name}</Text>
  </VStack>
}

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
}) => {
  const stats = [
    {
      name: 'DOLA Circulation',
      value: currentCirculatingSupply,
    },
    {
      name: 'DOLA 24h Vol.',
      value: dolaVolume,
    },
    {
      name: 'INV price',
      value: invPrice,
    },
    {
      name: 'TVL',
      value: firmTotalTvl ? firmTotalTvl : '-',
    },
    {
      name: 'DBR price',
      value: dbrPriceUsd ? dbrPriceUsd : '-',
    },
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
      <VStack className="landing-v3" w='full' alignItems="flex-start">
        <VStack zIndex="-1" position="fixed" top="0" left="0" height="100%" width="100%">
          <LandingAnimation2 loop={true} height="100%" width="100%" />
        </VStack>
        <VStack maxW="1300px" w='full' px="4%" py="5" alignItems="center">
          <FloatingNav />
        </VStack>
        <VStack pt="8" className="darkNavy" spacing="8" w='full' alignItems="center">
          <VStack spacing="0" w='full' alignItems="center">
            <Text as="h1" className="landing-v3-title" fontSize="6xl" fontWeight="bold">Experience Fixed Rate</Text>
            <Text as="h2" className="landing-v3-title" fontSize="6xl" fontWeight="bold">Unfixed Potential</Text>
          </VStack>
          <Text className="landing-v3-text" as="h3" fontSize="lg" fontWeight="bold">
            Stack your leverage with locked rates and multiply your returns - all in one click
          </Text>
          <LandingSubmitButton w={{ base: 'full', sm: 'auto' }} href="/firm">
            Launch App
          </LandingSubmitButton>
        </VStack>
      </VStack>
    </Layout>
  )
}

export default Landing;

export async function getServerSideProps(context) {
  context.res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return { ...await getLandingProps(context) }
}
