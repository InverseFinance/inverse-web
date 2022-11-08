// TODO: Clean up the landing page, this was rushed in a few hours
import { Box, Flex, HStack, Image, UnorderedList, ListItem, Spacer, Stack, Text, VStack, SimpleGrid } from '@chakra-ui/react'
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
import { LandingOutlineButton, LandingSubmitButton, RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { SimpleCard } from '@app/components/common/Cards/Simple'

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
        <VStack spacing="8" w='full' bgImage="/assets/v2/landing/part2.png" position="relative">
          <SplashedText
            splash="cross-dirty"
            containerProps={{ position: 'absolute', left: 0, top: 0 }}
            splashProps={{
              left: '-200px',
              top: '-100px',
              w: '400px',
              h: '400px',
              zIndex: '1',
              opacity: 0.8,
              bgColor: `${lightTheme?.colors.secAccentTextColor}`,
            }}
          >
          </SplashedText>
          <Image width="400px" zIndex="0" top="-200px" left="-200px" position="absolute" src="/assets/v2/landing/building1.png" />

          <Image borderRadius="999px" src="/assets/v2/landing/placeholder.png" w='250px' h="250px" />
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
        <SplashedText
          splash="circle-dirty"
          splashProps={{
            left: 'inherit',
            top: 'inherit',
            bottom: '-225px',
            right: '-250px',
            w: '400px',
            h: '400px',            
            bgColor: `${lightTheme?.colors.accentTextColor}`,
          }}
        ></SplashedText>
      </Flex>
      <Flex zIndex="1" px="8%" py="20" w="full" bg={lightTheme.colors.mainTextColor} bgColor={lightTheme.colors.mainTextColor} direction="column">
        <Stack direction={{ base: 'column', md: 'row' }} justify="center" alignItems="space-between" w='full'>
          <VStack justify="center" w='50%' h="260px">
            <Image borderRadius="999px" src="/assets/v2/landing/placeholder.png" w='260px' h="260px" />
          </VStack>
          <VStack spacing="4" justify="center" w='50%' alignItems="flex-start">
            <VStack w='full' spacing="0" alignItems="flex-start">
              <Text
                fontWeight="extrabold"
                color={`white`}
                fontSize="30px"
              >
                Smarter Collateral
              </Text>
              <Text color="white" fontWeight="bold" fontSize="20px">
                Introducing Personal Collateral Escrows
              </Text>
            </VStack>
            <UnorderedList color="white" pl="5">
              <ListItem>
                Isolates deposits by user
              </ListItem>
              <ListItem>
                Retains governance rights
              </ListItem>
              <ListItem>
                User collateral can never be borrowed
              </ListItem>
              <ListItem>
                Improved price oracle technology
              </ListItem>
              <ListItem>
                Highly customizable
              </ListItem>
            </UnorderedList>
            <LandingSubmitButton maxW='200px' bgColor="white" color={lightTheme.colors.mainTextColor}>
              View Whitepaper
            </LandingSubmitButton>
          </VStack>
        </Stack>
      </Flex>
      <Flex px="8%" py="20" w="full" bgImage="/assets/v2/landing/wall.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column" position="relative">
        <VStack alignItems="flex-start" spacing="2" w='full' bgImage="/assets/v2/landing/part2.png" position="relative">         
          <SplashedText
            as="h3"
            color={`${lightTheme?.colors.mainTextColor}`}
            fontSize="44px"
            fontWeight="extrabold"
            splash="horizontal-wave"
            splashProps={{ right: '-30px', left: 'inherit', bottom: 0, top: 'inherit' }}
          >
            Try Inverse
          </SplashedText>
          <Text fontWeight="bold" fontSize="20px">
            Put our protocol to work for you
          </Text>
        </VStack>
        <Stack mt="4" direction={{ base: 'column', md: 'row' }} justify="space-between" w='full' spacing="8">
          <SimpleCard minH="470px" w='33%' justify="space-between">
            <VStack w='full'>
              <Image src="/assets/v2/landing/borrow.png?1" width="full" w="160px" h="150px" mt="6" />
                <Text fontWeight="extrabold" fontSize="30px">Borrow</Text>
                <Text fontSize="18px">
                  Borrow DOLA for a fixed-rate for an unlimited duration with DOLA Borrowing Rights.
                </Text>
            </VStack>            
            <LandingSubmitButton>
              I want to Borrow
            </LandingSubmitButton>
          </SimpleCard>
          <SimpleCard minH="470px" w='33%' justify="space-between">
            <VStack w='full'>
              <Image src="/assets/v2/landing/earn.png" width="full" w="150px" h="150px" mt="6" />            
              <Text fontWeight="extrabold" fontSize="30px">Earn</Text>
              <Text fontSize="18px">
                Earn attractive returns when you provide liquidity to a trading pair on Curve, Convex, Balancer and others.
              </Text>
            </VStack>
            <LandingSubmitButton>
              I want to Earn
            </LandingSubmitButton>
          </SimpleCard>
          <SimpleCard minH="470px" w='33%' justify="space-between">
            <VStack w='full'>
              <Image src="/assets/v2/landing/stake.png?" width="full" w="150px" h="150px" mt="6" />
              <Text fontWeight="extrabold" fontSize="30px">Stake</Text>
              <Text fontSize="18px">
                Buy INV and stake on Frontier with high APY. Participate in Governance.
              </Text>
            </VStack>
            <LandingSubmitButton>
              I want to Stake INV
            </LandingSubmitButton>
          </SimpleCard>          
        </Stack>       
        <Image zIndex="-1" src="/assets/v2/landing/building4.png" w="300px" position="absolute" bottom="-100px" right="-100px" />
        <VStack w='full' alignItems="center" mt="20" spacing="8">
          <SplashedText
              as="h4"
              color={`${lightTheme?.colors.mainTextColor}`}
              fontSize="44px"
              fontWeight="extrabold"
              splash="horizontal-lr2"
              splashProps={{ w: '400px', h: '100px', left: '-20px', top: '-20px' }}
            >
              Meet our security partners
            </SplashedText>
          <Stack direction={{ base: 'column', md: 'row' }} justify="center" alignItems="center">
            <SimpleGrid columns={2} gap={4} w='60%'>
              <VStack w="250px" h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/code4arena.png" />
              </VStack>
              <VStack w="250px" h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/hats.png" />
              </VStack>
              <VStack w="250px" h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/defimoon.png" />
              </VStack>
              <VStack w="250px" h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/peckshield.png" />
              </VStack>
            </SimpleGrid>
            <VStack w='40%' alignItems="flex-start" spacing='4'>
              <Text fontWeight="bold" fontSize="24px">
                Designed from the ground up with security in mind and now backing it up with third party security professionals
              </Text>
              <Text fontSize="20px">
                We know the importance of security, especially for new lending protocols.Read our audit reports or work with us as we expand our third party security efforts.
              </Text>
              <LandingOutlineButton w='200px'>
                Learn More
              </LandingOutlineButton>
            </VStack>
          </Stack>
        </VStack>
      </Flex>
    </Layout>
  )
}

export default Landing
