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

  const priceBar = <HStack spacing="2.5vw">
    <HStack>
      <Image borderRadius='50px' minH="20px" minW="20px" height="2vmax" src="/assets/v2/dola.webp" alt="dola" />
      <Text fontSize={smallerSize2} display={{ base: 'none', sm: 'inline-block' }} fontWeight='bold' color={lightTheme.colors.mainTextColor}>DOLA</Text>
      <Text fontSize={smallerSize2} color={lightTheme.colors.mainTextColor}>{dolaPrice ? shortenNumber(dolaPrice, 3, true) : '-'}</Text>
    </HStack>
    <HStack>
      <Image borderRadius='50px' minH="20px" minW="20px" height="2vmax" src="/assets/v2/dbr.webp" alt="dbr" />
      <Text fontSize={smallerSize2} display={{ base: 'none', sm: 'inline-block' }} fontWeight='bold' color={lightTheme.colors.mainTextColor}>DBR</Text>
      <Text fontSize={smallerSize2} color={lightTheme.colors.mainTextColor}>{dbrPriceUsd ? shortenNumber(dbrPriceUsd, 3, true) : '-'}</Text>
    </HStack>
    <HStack>
      <Image borderRadius='50px' minH="20px" minW="20px" height="2vmax" src="/assets/v2/inv.jpg" alt="inv" />
      <Text fontSize={smallerSize2} display={{ base: 'none', sm: 'inline-block' }} fontWeight='bold' color={lightTheme.colors.mainTextColor}>INV</Text>
      <Text fontSize={smallerSize2} color={lightTheme.colors.mainTextColor}>{invPrice ? shortenNumber(invPrice, 2, true) : '-'}</Text>
    </HStack>
  </HStack>

  return (
    <Layout isLanding={true} pt="0" overflow="hidden">
      <Head>
        <title>Inverse Finance - Fixed-Rate DeFi borrowing</title>
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/landing.png" />
        <link rel="canonical" href="https://inverse.finance" />
      </Head>
      <video autoPlay muted loop webkit-playsinline style={{
        position: 'absolute',
        width: '100vw',
        top: 0,
        left: 0,
      }} playsInline>
        <source src="/assets/v2/landing/landing-anim.mp4" type="video/mp4" />
      </video>
      <Flex px="8%" pb="0px" pt={{ base: 6, lg: '7vh' }} w="full" h="100vh" bgImage="/assets/v2/landing/hero.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column">
        <VStack w='full' alignItems={{ base: 'center', sm: 'flex-end' }} position="relative" zIndex="10">
          <HStack w='full' justify={{ base: 'space-between', sm: 'flex-end' }}>
            {priceBar}
            <BurgerMenu navItems={MENUS.nav} isLanding={true} filler={priceBar} />
          </HStack>
          <LandingNav />
        </VStack>
        <VStack w='full' pt={{ base: '50px', md: '5vh' }}>
          <Stack position="relative" direction={{ base: 'column', md: 'row' }} w='full' justify="space-between" alignItems="space-between">
            <VStack
              pt={{ base: '10px', lg: '50px', '2xl': '10vh' }}
              alignItems="flex-start"
              maxW={{ base: 'full', md: '50%' }}
              spacing="2vh"
            >
              <SplashedText
                as="h2"
                color={`${lightTheme?.colors.mainTextColor}`}
                fontSize={{ base: '50px', sm: '58px', lg: '66px', 'xl': '70px', '2xl': "5vw" }}
                fontWeight="800"
                lineHeight='1'
                splashProps={{
                  minH: '35px',
                  h: '3vw',
                  w: { base: '220px', sm: '40vw', md: '33vw', lg: "22vw", xl: '24.5vw', '2xl': "25vw" },
                  left: '-3vw',
                  top: { base: '10px', sm: '20px', 'xl': '30px', '2xl': '2vmax' }
                }
                }
              >
                Rethink<br />The Way<br />You Borrow
              </SplashedText>
              <VStack spacing="2vh" alignItems="flex-start" zIndex="1">
                <Text w={{ base: 'auto', 'xl': '580px', '2xl': '1000px' }} fontWeight="400" fontSize={{ base: '20px', '2xl': '1.5vw' }} maxW={{ base: 'none', xl: '460px', '2xl': '40vw' }} as="h2" color={`${lightTheme?.colors.mainTextColor}`}>
                  DOLA Borrowing Rights replace interest rates with a fixed fee that can earn you more.
                </Text>
                <Stack direction={{ base: 'column', sm: 'row' }} justify={'flex-start'} w={{ base: 'full', sm: 'auto' }}>
                  <LandingSubmitButton w={{ base: 'full', sm: 'auto' }} href="/firm">
                    Enter App
                  </LandingSubmitButton>
                  {/* <LandingOutlineButton w={{ base: 'full', sm: 'auto' }} href="https://docs.inverse.finance" target="_blank">
                    Read Docs <ExternalLinkIcon ml="1" />
                  </LandingOutlineButton> */}
                </Stack>
              </VStack>
            </VStack>
          </Stack>
        </VStack>
      </Flex>
      <Flex px="8%" py="20" w="full" bgImage="/assets/v2/landing/part2.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column">
        <VStack mt="10" spacing="8" w='full' position="relative">
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
          <Image width="400px" zIndex="0" top="-200px" left="-200px" position="absolute" src="/assets/v2/landing/building1.png" alt="building" />

          <VStack spacing="0" pt="0" pb="4" alignItems="center" w='200px' position="relative">
            <SplashedText
              splash="large"
              zIndex="1"
              // animation="1.5s text-highlight linear infinite"
              zIndex="3"
              color={lightTheme.colors.secAccentTextColor}
              fontWeight="900"
              fontSize="120px"
              splashProps={{
                left: '-125px',
                top: '-120px',
                w: '400px',
                h: '400px',
                zIndex: '2',
                bgColor: `${lightTheme?.colors.accentTextColor}`,
              }}
            >
              0%
            </SplashedText>
            {/* <Text animation="2s text-highlight linear infinite" zIndex="1" color={lightTheme.colors.accentTextColor} fontWeight="bold" fontSize="100px">
              0%
            </Text> */}
            {/* <Image zIndex="2" borderRadius="999px" src="/assets/v2/landing/interests.png" w='200px' h="200px" /> */}
          </VStack>
          <SplashedText
            as="h3"
            color={`${lightTheme?.colors.mainTextColor}`}
            fontSize={biggerSize}
            fontWeight="extrabold"
            splash="horizontal-wave"
            textAlign="center"
            splashProps={{ right: { base: '0', sm: '-30px' }, left: 'inherit', bottom: 0, top: 'inherit' }}
          >
            Never Pay Interest Again
          </SplashedText>
          <Text color={lightTheme.colors.mainTextColor} zIndex="2" textAlign="center" fontWeight="bold" fontSize={normalSize} maxW={{ base: '350px', '2xl': '33%' }}>
            High-volatility interest rates don't work for long-term borrowers.
          </Text>
          <Text color={lightTheme.colors.mainTextColor} zIndex="2" textAlign="center" fontSize={smallerSize} maxW={{ base: '350px', '2xl': '33%' }}>
            DOLA Borrowing Rights (DBRs) allow you to get a fixed rate today and borrow later
          </Text>
          <Stack zIndex="2" direction={{ base: 'column', sm: 'row' }} justify={'flex-start'} w={{ base: 'full', sm: 'auto' }}>
            <LandingSubmitButton w={{ base: 'full', sm: 'auto' }} href="/firm">
              Enter App
            </LandingSubmitButton>
            <LandingOutlineButton w={{ base: 'full', sm: 'auto' }} href="https://docs.inverse.finance" target="_blank">
              Read Docs <ExternalLinkIcon ml="1" />
            </LandingOutlineButton>
          </Stack>
        </VStack>
        {/* <VStack mt="150px" alignItems="center" spacing="2" w='full' bgImage="/assets/v2/landing/part2.png" position="relative">
          <VStack spacing="2" w='full' alignItems="flex-start">
            <ResponsiveStack w='full' alignItems={{ base: 'flex-start', sm: 'flex-start' }}>
              <SplashedText
                as="h3"
                color={`${lightTheme?.colors.mainTextColor}`}
                fontSize={biggerSize}
                fontWeight="extrabold"
                splash="horizontal-wave"
                splashProps={{ right: '-30px', left: { base: 0, md: 'inherit' }, bottom: { base: 0, '2xl': '1vh' }, top: 'inherit' }}
              >
                Organic Fat Yield with sDOLA
              </SplashedText>
            </ResponsiveStack>
            <HStack spacing="0" ref={ref}>
              <Text mr="1" color={`${lightTheme?.colors.success}`} fontWeight="extrabold" fontSize={slightlyBiggerSize2}>
                {shortenNumber(apy, 2)}%
              </Text>
              <Text mr='1' fontWeight="extrabold" fontSize={normalSize}>
                APY
              </Text>
              <Text mr='1' fontWeight="extrabold" fontSize={normalSize}>
                (Projected:
              </Text>
              <Text color={`${lightTheme?.colors.success}`} fontWeight="extrabold" fontSize={slightlyBiggerSize2}>
                {shortenNumber(projectedApy, 2)}%
              </Text>
              <Text fontWeight="extrabold" fontSize={normalSize}>
                )
              </Text>
            </HStack>
          </VStack>
          <iframe mt="20px" style={{ zIndex: 10 }} width="100%" height={videoOpHeight} src={`https://www.youtube.com/embed/w1f5ShMX3Aw?mute=1${autoplay ? '&autoplay=1' : ''}`} title="sDOLA: The Organic, Yield-Bearing Stablecoin" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          <LandingSubmitButton mt="8" w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="/sDOLA">
            Stake DOLA
          </LandingSubmitButton>
        </VStack> */}
        {/* <SplashedText
            as="h3"
            color={`${lightTheme?.colors.mainTextColor}`}
            fontSize={biggerSize}
            fontWeight="extrabold"
            splash="horizontal-wave"
            splashProps={{ right: '-30px', left: 'inherit', bottom: { base: 0, '2xl': '1vh' }, top: 'inherit' }}
          >
            Compare Borrow Rates
          </SplashedText> */}
        <SplashedText
          splash="circle-dirty"
          splashProps={{
            left: 'inherit',
            top: 'inherit',
            bottom: '-250px',
            right: '-250px',
            w: '400px',
            h: '400px',
            bgColor: `${lightTheme?.colors.accentTextColor}`,
          }}
        ></SplashedText>
      </Flex>
      <Flex display={{ base: 'none', xl: 'flex' }} zIndex="1" px="8%" py="20" w="full" bg={lightTheme.colors.mainTextColor} bgColor={lightTheme.colors.mainTextColor} direction="column">
        {/* <Text as="h2" fontWeight="bold" color={lightTheme.colors.contrastMainTextColor} zIndex="2" textAlign="left" fontSize={normalSize}>
          Compare Fixed Rate and Variable Rates accross DeFi protocols
        </Text>
        <RateComparator themeStyles={lightTheme} showLabel={false} /> */}
        <ResponsiveStack spacing="8" justifyContent="space-evenly" w='full' direction={{ base: 'column', md: 'row' }}>
          <VStack spacing="6" justify="center" alignItems="flex-start">
            <VStack w='full' spacing="1" alignItems="flex-start">
              <Text
                fontWeight="extrabold"
                color={`white`}
                fontSize={biggerSize}
              >
                Introducing sDOLA
              </Text>
              <Text color="white" fontWeight="bold" fontSize={normalSize}>
                Inverse's new Yield-bearing Stablecoin
              </Text>
            </VStack>
            <UnorderedList fontSize={smallerSize} color="white" pl="5">
              <ListItem>
                APY currently {shortenNumber(apy, 2)}% (projected {shortenNumber(projectedApy, 2)}%)
              </ListItem>
              <ListItem>
                100% Organic, On-chain Yield
              </ListItem>
              <ListItem>
                Fully Decentralized, No Third Party Custodians
              </ListItem>
              <ListItem>
                Withdraw Anytime Without Penalty
              </ListItem>
            </UnorderedList>
            <LandingSubmitButton
              w={{ base: 'full', sm: 'auto' }}
              maxW={{ sm: '200px', '2xl': 'none' }}
              bgColor="white"
              color={lightTheme.colors.mainTextColor}
              href="/whitepaper/sDOLA">
              View Whitepaper
            </LandingSubmitButton>
          </VStack>
          <VStack justify="center" minH="200px" position="relative">
            <video preload="metadata" width="600" height="330" style={{ zIndex: 10, maxWidth: '98%' }} controls webkit-playsinline playsInline>
              <source src="sDOLA.mp4#t=0.1" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </VStack>
        </ResponsiveStack>
      </Flex>
      <Flex px="8%" py="20" w="full" bgImage="/assets/v2/landing/wall.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column" position="relative">
        <VStack alignItems="flex-start" spacing="2" w='full' bgImage="/assets/v2/landing/part2.png" position="relative">
          <SplashedText
            as="h3"
            color={`${lightTheme?.colors.mainTextColor}`}
            fontSize={biggerSize}
            fontWeight="extrabold"
            splash="horizontal-wave"
            splashProps={{ right: '-30px', left: 'inherit', bottom: { base: 0, '2xl': '1vh' }, top: 'inherit' }}
          >
            Try Inverse
          </SplashedText>
          {/* <Text color="mainTextColorLight" fontWeight="bold" fontSize={normalSize}>
            Put our protocol to work for you
          </Text> */}
        </VStack>
        <VStack spacing="0" mt="4" position="relative">
          <SplashedText
            splash="cross-dirty"
            containerProps={{ position: 'absolute', left: '-380px', zIndex: '0', bottom: '-200px' }}
            splashProps={{ left: '0', bottom: 0, top: 'inherit', bgColor: lightTheme.colors.accentTextColor, w: '500px', h: '500px' }}
          >
          </SplashedText>
          <ResponsiveStack zIndex="1" justify="space-between" w='full' spacing="8" alignItems={{ base: 'center', md: 'unset' }}>
            <SimpleCard spacing="1vh" position="relative" minH="470px" w={{ base: 'full', md: '33%' }} maxW="600px" alignItems="center" justify="space-between">
              <VStack w='full'>
                <Image src="/assets/v2/landing/borrow.png?1" alt="borrow" width="full" w="160px" h="150px" mt="6" />
                <Text color={lightTheme.colors.mainTextColor} fontWeight="extrabold" fontSize={biggerSize}>Borrow</Text>
                <Text color={lightTheme.colors.mainTextColor} textAlign="center" fontSize={normalSize}>
                  Borrow the DOLA stablecoin at a fixed-rate for an unlimited duration with DOLA Borrowing Rights.
                </Text>
              </VStack>
              <LandingSubmitButton href="/firm">
                I want to Borrow
              </LandingSubmitButton>
            </SimpleCard>
            <SimpleCard spacing="1vh" minH="470px" w={{ base: 'full', md: '33%' }} maxW="600px" alignItems="center" justify="space-between">
              <VStack w='full'>
                <Image src="/assets/v2/landing/earn.png" alt="earn" width="full" w="150px" h="150px" mt="6" />
                <Text color={lightTheme.colors.mainTextColor} fontWeight="extrabold" fontSize={biggerSize}>Earn</Text>
                <Text color={lightTheme.colors.mainTextColor} textAlign="center" fontSize={normalSize}>
                  Benefit from DOLA's high-yield opportunities when you provide liquidity to a trading pair on Curve, Convex, Balancer and others.
                </Text>
              </VStack>
              <LandingSubmitButton href="/yield-opportunities">
                I want to Earn
              </LandingSubmitButton>
            </SimpleCard>
            <SimpleCard spacing="1vh" minH="470px" w={{ base: 'full', md: '33%' }} maxW="600px" alignItems="center" justify="space-between">
              <VStack w='full'>
                <Image src="/assets/v2/landing/stake.png?" alt="stake" width="full" w="150px" h="150px" mt="6" />
                <Text color={lightTheme.colors.mainTextColor} fontWeight="extrabold" fontSize={biggerSize}>Real yield</Text>
                <Text color={lightTheme.colors.mainTextColor} textAlign="center" fontSize={normalSize}>
                  Buy INV and stake on FiRM to earn DBR real yield, you directly benefit from FiRM's success. Participate in Governance.
                </Text>
              </VStack>
              <LandingSubmitButton href="/firm/INV">
                I want to Stake INV
              </LandingSubmitButton>
            </SimpleCard>
          </ResponsiveStack>
        </VStack>
        <Image zIndex="-1" src="/assets/v2/landing/building4.png" alt="building" w="300px" position="absolute" bottom="450px" right="-100px" />
        <VStack w='full' alignItems="center" mt="150px" spacing="8">
          <SplashedText
            as="h4"
            color={`${lightTheme?.colors.mainTextColor}`}
            fontSize={biggerSize}
            fontWeight="extrabold"
            splash="horizontal-lr2"
            splashProps={{ w: '400px', h: '100px', left: '-20px', top: '-20px' }}
          >
            Meet Our Security Partners
          </SplashedText>
          <ResponsiveStack spacing="8" pt="4" justify="center" alignItems={{ base: 'center' }}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w={{ base: 'full', md: '50%' }} maxW="800px">
              <VStack as="a" href="https://code4rena.com/" target="_blank" w={{ base: 'full' }} h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/code4arena.png" alt="code4arena" />
              </VStack>
              <VStack as="a" href="https://immunefi.com/" target="_blank" w={{ base: 'full' }} h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/partners/immunefi.svg" alt="immunefi" />
              </VStack>
              <VStack as="a" href="https://defimoon.org/" target="_blank" w={{ base: 'full' }} h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/defimoon.png?v2" alt="defimoon" />
              </VStack>
              <VStack as="a" href="https://peckshield.com/" target="_blank" w={{ base: 'full' }} h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/peckshield.png" alt="peckshield" />
              </VStack>
              <VStack as="a" href="https://defisafety.com/app/pqrs/199" target="_blank" w={{ base: 'full' }} h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/defisafety.png" alt="defisafety" />
              </VStack>
              <VStack as="a" href="https://www.nomoi.xyz/" target="_blank" w={{ base: 'full' }} h="180px" bgColor="white" alignItems="center" justify="center">
                <Image maxW="150px" src="/assets/v2/landing/nomoi.png" alt="nomoi" />
              </VStack>
            </SimpleGrid>
            <VStack alignItems={{ base: 'center', sm: 'flex-start' }} w={{ base: 'full', md: '40%' }} spacing='4' pt={{ base: '4', md: '0' }}>
              <ResponsiveStack w='full' alignItems="center" justify="space-around">
                {audits.map(stat => <StatBasic key={stat.name} {...stat} />)}
              </ResponsiveStack>
              <Divider borderColor={lightTheme.colors.mainTextColorLight} />
              <Text color={lightTheme.colors.mainTextColor} fontWeight="bold" fontSize={normalSize}>
                Designed from the ground up with security in mind and now backing it up with third party security professionals
              </Text>
              <Text color={lightTheme.colors.mainTextColor} fontSize={smallerSize}>
                We know the importance of security, especially for new lending protocols. Read our audit reports or work with us as we expand our third party security efforts.
              </Text>
              <LandingOutlineButton w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="/audits">
                Audit Reports <ExternalLinkIcon ml="1" />
              </LandingOutlineButton>
            </VStack>
          </ResponsiveStack>
        </VStack>
      </Flex>
      <Flex zIndex="1" px="8%" py="10" w="full" bgColor={lightTheme.colors.mainTextColor} direction="column" position="relative">
        <ResponsiveStack spacing="4" alignItems="center" justify={{ base: 'space-between', '2xl': 'space-evenly' }}>
          <Text fontSize={smallerSize} color="white" maxW={{ md: '600px', '2xl': '40%' }}>
            Inverse Finance invites developers and security researches to take a look at our repos on Github and earn bug bounty rewards.
          </Text>
          <LandingOutlineButton w={{ base: 'full', sm: '220px', '2xl': 'auto' }} boxShadow="none" href="https://docs.inverse.finance/inverse-finance/technical/bug-bounty">
            Bug Bounty Program
          </LandingOutlineButton>
        </ResponsiveStack>
      </Flex>
      <VStack spacing="20" px="8%" py="20" w="full" bgRepeat="no-repeat" backgroundSize="cover" direction="column" position="relative"
        bgImage="/assets/v2/landing/wall.png"
        _after={{
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100vh',
          top: 0,
          left: 0,
          zIndex: '-2',
          backgroundSize: 'cover',
          backgroundImage: `url('/assets/v2/landing/wall.png')`,
          transform: 'rotate(180deg)',
        }}
      >
        <VStack alignItems="flex-start" spacing="2" w='full' bgImage="/assets/v2/landing/part2.png" position="relative">
          <SplashedText
            splash="cross-dirty"
            containerProps={{ top: '-160px', zIndex: '0', right: '-150px', left: 'inherit', position: "absolute" }}
            splashProps={{ bgColor: lightTheme?.colors.secAccentTextColor, right: 0, left: 'inherit', bottom: '-10px', top: 'inherit', height: '600px', width: '400px' }}
          >
          </SplashedText>
          <ResponsiveStack w='full' alignItems="flex-start">
            <SplashedText
              as="h3"
              color={`${lightTheme?.colors.mainTextColor}`}
              fontSize={biggerSize}
              fontWeight="extrabold"
              splash="horizontal-rl"
              splashProps={{ right: 0, left: 'inherit', bottom: '-10px', top: 'inherit' }}
            >
              Our Ecosystem
            </SplashedText>
            <LandingSubmitButton w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="https://discord.gg/YpYJC7R5nv" target="_blank">
              Become a Partner
            </LandingSubmitButton>
          </ResponsiveStack>
          <Ecosystem />
        </VStack>
        <VStack alignItems="flex-start" spacing="2" w='full' py="20" position="relative">
          <ResponsiveStack w='full' alignItems={{ base: 'flex-start', sm: 'flex-start' }}>
            <SplashedText
              as="h3"
              color={`${lightTheme?.colors.mainTextColor}`}
              fontSize={biggerSize}
              fontWeight="extrabold"
              splash="circle"
              splashProps={{ right: '-60px', h: '80px', left: 'inherit', bottom: '-10px', top: 'inherit' }}
            >
              The Stats
            </SplashedText>
            <LandingSubmitButton w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="/analytics">
              DAO Analytics
            </LandingSubmitButton>
          </ResponsiveStack>
          <Text color={lightTheme.colors.mainTextColor} fontSize={smallerSize}>
            Inverse Finance DAO operates unmatched transparency into its operation and governance
          </Text>
          <ResponsiveStack pt="8" w='full' alignItems="center">
            {stats.map(stat => <Stat key={stat.name} {...stat} />)}
          </ResponsiveStack>
        </VStack>
        <VStack alignItems="flex-start" spacing="2" w='full' position="relative">
          <VStack w='full'>
            <ResponsiveStack direction={{ base: 'column', lg: 'row' }} w='full' alignItems="flex-start" zIndex="2">
              <SplashedText
                as="h3"
                color={`${lightTheme?.colors.mainTextColor}`}
                fontSize={biggerSize}
                fontWeight="extrabold"
                splash="horizontal-wave"
                splashProps={{
                  w: '250px',
                  h: '50px',
                  right: '0',
                  left: { base: 0, md: 'inherit' },
                  bottom: 0,
                  top: 'inherit',
                }}
              >
                Built For You, Governed By You
              </SplashedText>
              <LandingSubmitButton w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="/transparency">
                DAO Transparency
              </LandingSubmitButton>
            </ResponsiveStack>
            <Image zIndex="0" src="/assets/v2/landing/building5.png" alt="building" h='600px' mr="1" position="absolute" right="-16%" top="-120px" />
          </VStack>
          <ResponsiveStack pt="8" w='full' alignItems="center" justify="space-around" zIndex="1">
            <VStack position="relative" spacing="0" w={{ md: '33%', '2xl': '25%' }}>
              <SimpleCard zIndex="1" spacing="0" p="0" >
                <video autoPlay muted loop webkit-playsinline style={{
                  width: '100%',
                }} playsInline>
                  <source src="/assets/v2/landing/dao.mp4" type="video/mp4" />
                </video>
              </SimpleCard>
              <VStack zIndex="1" width="100%" height="100%" top="0" left="0" position="absolute" boxShadow="inset 0 0 0 1px #FEFEFE"></VStack>
              <SplashedText
                splash="cross-dirty"
                containerProps={{
                  top: '-60px', left: '-6vw', zIndex: '0', position: "absolute", display: {
                    // base: 'none', md: 'inline-block'
                  }
                }}
                splashProps={{ bgColor: lightTheme?.colors.accentTextColor, left: 'inherit', height: '600px', width: '400px' }}
              >
              </SplashedText>
            </VStack>
            <VStack zIndex="1" w={{ base: 'full', md: '40%' }} alignItems="flex-start" spacing='4' pt={{ base: '4', md: '0' }}>
              <Text color={lightTheme.colors.mainTextColor} fontWeight="bold" fontSize={normalSize}>
                Inverse uses 100% on-chain  voting  that avoids the pitfalls of centralized DAO governance.
              </Text>
              <Text color={lightTheme.colors.mainTextColor} fontSize={smallerSize}>
                We are the most transparent DAO in DeFi with unprecedented levels of operational visibility.
              </Text>
              <ResponsiveStack justify={{ base: 'center', md: 'flex-start' }} direction={{ base: 'column', sm: 'row', md: 'column', lg: 'row' }} w={{ base: 'full', lg: 'auto' }}>
                <LandingSubmitButton w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="https://discord.gg/YpYJC7R5nv" target="_blank">
                  <Image src="/assets/socials/discord.svg" alt="discord" h={btnIconSize} mr={{ base: '1', '2xl': 2 }} />
                  Join our Discord
                </LandingSubmitButton>
                <LandingOutlineButton w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="/governance">
                  View Proposals
                </LandingOutlineButton>
              </ResponsiveStack>
            </VStack>
          </ResponsiveStack>
        </VStack>
        <VStack pt="200px" alignItems="flex-start" spacing="8" w='full' position="relative">
          <ResponsiveStack w='full' alignItems="center" justify="space-between">
            <SplashedText
              as="h3"
              color={`${lightTheme?.colors.mainTextColor}`}
              fontSize={biggerSize}
              fontWeight="extrabold"
              splash="horizontal-rl"
              splashProps={{
                w: { base: '300px', md: '400px' }, h: '40px', right: '-20px', left: { base: '0', md: 'inherit' }, bottom: '-10px', top: 'inherit'
              }}
            >
              The Latest Alpha...
            </SplashedText>
            <ResponsiveStack direction={{ base: 'column', sm: 'row' }} w={{ base: 'full', sm: 'auto' }}>
              <LandingSubmitButton w={{ base: 'full', sm: '200px', '2xl': 'auto' }} href="https://twitter.com/InverseFinance" target="_blank">
                <Image src="/assets/socials/twitter.svg" alt="twitter" h={btnIconSize} mr={{ base: '1', '2xl': 2 }} />
                Follow on Twitter
              </LandingSubmitButton>
              <LandingSubmitButton w={{ base: 'full', md: 'auto' }} href="/blog">
                View Blog
              </LandingSubmitButton>
            </ResponsiveStack>
          </ResponsiveStack>
          <VStack spacing="0" w='full' alignItems="flex-start">
            <ResponsiveStack overflow="visible" spacing="6" w={{ base: 'full', md: 'auto' }} alignItems={{ base: 'center', md: 'unset' }}>
              {posts.map(post => {
                return <LightPostPreview zIndex="1" key={post.slug} w={{ base: 'full', md: '300px', '2xl': '450px' }} {...post} />
              })}
            </ResponsiveStack>
            <SplashedText
              splash="cross-dirty"
              containerProps={{ top: '-30px', zIndex: '0', right: '-550px', left: 'inherit', position: "absolute" }}
              splashProps={{ bgColor: lightTheme?.colors.secAccentTextColor, right: 0, left: 'inherit', top: 'inherit', height: '600px', width: '600px', transform: 'rotate(-75deg)' }}
            >
            </SplashedText>
          </VStack>
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
