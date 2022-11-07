// TODO: Clean up the landing page, this was rushed in a few hours
import { Box, Flex, HStack, Image, Spacer, Stack, Text, VStack } from '@chakra-ui/react'
import { RTOKEN_CG_ID } from '@app/variables/tokens'
import LinkButton from '@app/components/common/Button'
import Layout from '@app/components/common/Layout'
import { LandingNav } from '@app/components/common/Navbar'
import { useDOLA } from '@app/hooks/useDOLA'
import { usePrices } from '@app/hooks/usePrices'
import { useTVL } from '@app/hooks/useTVL'
import Link from '@app/components/common/Link'
import Head from 'next/head'
import { darkTheme, lightTheme } from '@app/variables/theme'
import { SplashedText } from '@app/components/common/SplashedText'
import { LandingOutlineButton, LandingSubmitButton } from '@app/components/common/Button/RSubmitButton'

const projects = [
  '/assets/projects/Scream.webp',
  '/assets/projects/Fantom.png',
  '/assets/projects/Olympus.png',
  '/assets/projects/Ether.png',
  '/assets/projects/YFI.svg',
  '/assets/projects/Sushiswap.png',
  '/assets/projects/Lido.png',
  '/assets/projects/Anyswap.png',
]

const cards = [
  {
    title: 'INV',
    description: 'Scale your earnings with Positive Sum Rewards & revenue sharing',
    label: 'Buy and Stake INV',
    image: '/assets/products/vaults.png',
    href: '/frontier',
    bg: "url('/assets/stake-inv.png')",
  },
  {
    title: 'Frontier',
    description: 'Earn more with decentralized, capital-efficient lending, borrowing',
    label: 'Lend & Borrow',
    image: '/assets/products/anchor.png',
    href: '/frontier',
    bg: "url('/assets/frontier.png')",
  },
  {
    title: 'DOLA',
    description: 'Borrow our fully-collateralized, low-interest stablecoin',
    label: 'Swap DOLA',
    image: '/assets/products/dola.png',
    href: '/stabilizer',
    bg: "url('/assets/dola.png')",
  },
]

const formatStat = ({ value, showDollar, showPercentage }: any): string => {
  const _value = value || 0

  if (showPercentage) {
    return `${(_value * 100).toFixed(0)}%`
  }

  let display = _value.toLocaleString()
  if (_value >= Math.pow(10, 9)) {
    display = `${(_value / Math.pow(10, 9)).toFixed(2)}b`
  } else if (_value >= Math.pow(10, 6)) {
    display = `${(_value / Math.pow(10, 6)).toFixed(2)}m`
  } else if (_value >= Math.pow(10, 4)) {
    display = `${(_value / Math.pow(10, 3)).toFixed(0)}k`
  }

  return `${showDollar ? '$' : ''}${display}`
}

export const Landing = () => {
  const { totalSupply } = useDOLA()
  const { prices } = usePrices()
  const { tvl } = useTVL()

  const stats = [
    {
      label: 'TVL',
      value: tvl,
      showDollar: true,
    },
    {
      label: 'DOLA Supply',
      value: totalSupply,
      showDollar: true,
    },
    {
      label: '$INV Price',
      value: prices[RTOKEN_CG_ID] ? prices[RTOKEN_CG_ID].usd : 0,
      showDollar: true,
    },
  ]

  return (
    <Layout pt="0">
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE}</title>
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/home.png" />
      </Head>
      <Flex px="8%" py="0px" w="full" h="100vh" bgImage="/assets/v2/landing/hero.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column">
        <LandingNav />
        <VStack w='full' pt="50px">
          <Stack position="relative" direction={{ base: 'column', md: 'row' }} w='full' justify="space-between" alignItems="space-between">
            <VStack alignItems="flex-start" maxW="450px">
              <SplashedText
                as="h1"
                color={`${lightTheme?.colors.mainTextColor}`}
                fontSize="44px"
                fontWeight="extrabold"
              >
                Rethink<br />The Way<br />You Borrow
              </SplashedText>
              <VStack spacing="4" alignItems="flex-start">
                <Text fontSize="20px" as="h2" color={`${lightTheme?.colors.mainTextColor}`}>
                  DOLA Borrowing Rights replace interest rates with a fixed fee that can earn you more.
                </Text>
                <HStack>
                  <LandingSubmitButton>
                    Try Beta
                  </LandingSubmitButton>
                  <LandingOutlineButton>
                    Learn More
                  </LandingOutlineButton>
                </HStack>
              </VStack>
            </VStack>
          </Stack>
        </VStack>
      </Flex>     
      <Flex px="8%" py="20" w="full" h="100vh" bgImage="/assets/v2/landing/part2.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column">
          <VStack w='full' bgImage="/assets/v2/landing/part2.png">
              <SplashedText
                as="h3"
                color={`${lightTheme?.colors.mainTextColor}`}
                fontSize="44px"
                fontWeight="extrabold"
                splash="horizontal-wave"
                splashProps={{ right: '-30px', left: 'inherit', bottom: 0, top: 'inherit' }}
              >
                Never Pay Interest Again
              </SplashedText>
              <Text textAlign="center" fontWeight="bold" fontSize="20px" maxW='350px'>
                High-volatility interest rates don't work for long-term borrowers.
              </Text>
              <Text textAlign="center" fontSize="16px" maxW='350px'>
                DOLA Borrowing Rights (DBRs) allow you to fix a rate today and borrow later
              </Text>
          </VStack>
          </Flex> 
    </Layout>
  )
}

export default Landing
