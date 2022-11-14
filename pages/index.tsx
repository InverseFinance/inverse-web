// TODO: Clean up the landing page, this was rushed in a few hours
import { Flex, HStack, Image, UnorderedList, ListItem, Stack, Text, VStack, SimpleGrid, StackProps } from '@chakra-ui/react'
import { RTOKEN_CG_ID } from '@app/variables/tokens'
import Layout from '@app/components/common/Layout'
import { LandingNav } from '@app/components/common/Navbar'
import { useDOLA } from '@app/hooks/useDOLA'
import { usePrices } from '@app/hooks/usePrices'
import { useTVL } from '@app/hooks/useTVL'
import Link from '@app/components/common/Link'
import Head from 'next/head'
import { lightTheme } from '@app/variables/theme'
import { SplashedText } from '@app/components/common/SplashedText'
import { LandingOutlineButton, LandingSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { SimpleCard } from '@app/components/common/Cards/Simple'
import { shortenNumber } from '@app/util/markets'
import { getLandingProps } from '@app/blog/lib/utils'
import LightPostPreview from '@app/blog/components/light-post-preview'
import { useDBRPrice } from '@app/hooks/useDBR'
import { Ecosystem } from '@app/components/Landing/Ecosystem'

const ResponsiveStack = (props: StackProps) => <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" {...props} />

const Stat = ({ value, name }: { value: number, name: string }) => {
  return <VStack>
    <Text fontSize="40px" fontWeight="bold">{shortenNumber(value, 2, true)}</Text>
    <Text fontSize="16px">{name}</Text>
  </VStack>
}

const tempData =  require('./temp.json');

export const Landing = ({  }: {
  posts: any[]
}) => {
  const { posts } = tempData;
  const { totalSupply } = useDOLA();
  const { prices } = usePrices();
  const { price: dbrPrice } = useDBRPrice();
  const { tvl } = useTVL();

  const invPrice = prices[RTOKEN_CG_ID] ? prices[RTOKEN_CG_ID].usd : 0;
  const dolaPrice = prices['dola-usd'] ? prices['dola-usd'].usd : 0;

  const stats = [
    {
      name: 'DOLA Circulation',
      value: totalSupply,
    },
    {
      name: 'INV price',
      value: invPrice,
    },
    {
      name: 'TVL',
      value: tvl,
    },
    {
      name: 'DBR price',
      value: dbrPrice,
    },
  ]

  return (
    <Layout isLanding={true} pt="0" overflow="hidden">
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE}</title>
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/landing.png" />
      </Head>
      <video autoPlay muted loop style={{
        position: 'absolute',        
        width: '100vw',
        top: 0,
        left: 0,
      }}>
        <source src="/assets/v2/landing/landing-anim.mp4" type="video/mp4" />
      </video>
      <Flex px="8%" pb="0px" pt="12" w="full" h="100vh" bgImage="/assets/v2/landing/hero.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column">
        <VStack w='full' alignItems="flex-end" zIndex="1">
          <HStack spacing="6">
            <HStack>
              <Image borderRadius='50px' height="20px" src="/assets/v2/dola.png" />
              <Text fontWeight='bold' color={lightTheme.colors.mainTextColor}>DOLA</Text>
              <Text color={lightTheme.colors.mainTextColor}>{shortenNumber(dolaPrice, 3, true)}</Text>
            </HStack>
            <HStack>
              <Image borderRadius='50px' height="20px" src="/assets/v2/dbr.svg" />
              <Text fontWeight='bold' color={lightTheme.colors.mainTextColor}>DBR</Text>
              <Text color={lightTheme.colors.mainTextColor}>{shortenNumber(dbrPrice, 3, true)}</Text>
            </HStack>
            <HStack>
              <Image borderRadius='50px' height="20px" src="/assets/inv-square-dark.jpeg" />
              <Text fontWeight='bold' color={lightTheme.colors.mainTextColor}>INV</Text>
              <Text color={lightTheme.colors.mainTextColor}>{shortenNumber(invPrice, 2, true)}</Text>
            </HStack>
          </HStack>
          <LandingNav />
        </VStack>
        <VStack w='full' pt="50px">
          <Stack position="relative" direction={{ base: 'column', md: 'row' }} w='full' justify="space-between" alignItems="space-between">
            <VStack pt={{ base: '10vh', md: '10vh' }} alignItems="flex-start" maxW={{ base: 'full', md: '450px', '2xl': '900px' }}>
              <SplashedText
                as="h1"
                color={`${lightTheme?.colors.mainTextColor}`}
                fontSize={{ base: '44px', sm: '66px' }}
                fontWeight="extrabold"
                lineHeight="1"
                splashProps={{ h: '30px', w: { base: '200px', sm: '300px' }, left: '-30px', top: { base: '10px', sm: '35px' } }}
              >
                Rethink<br />The Way<br />You Borrow
              </SplashedText>
              <VStack spacing="4" alignItems="flex-start" zIndex="1">
                <Text fontSize={{ base: '20px', '2xl': '1.5vw' }} maxW={{ base: 'none', sm: '40vw' }} as="h2" color={`${lightTheme?.colors.mainTextColor}`}>
                  DOLA Borrowing Rights replace interest rates with a fixed fee that can earn you more.
                </Text>
                <HStack>
                  <LandingSubmitButton h='50px' fontSize="18px" href="/firm">
                    Try Beta
                  </LandingSubmitButton>
                  <LandingOutlineButton h='50px' fontSize="18px" href="https://docs.inverse.finance/inverse-finance/firm" target="_blank">
                    Learn More
                  </LandingOutlineButton>
                </HStack>
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
          <Image width="400px" zIndex="0" top="-200px" left="-200px" position="absolute" src="/assets/v2/landing/building1.png" />
          
          <VStack spacing="0" pt="0" pb="6" alignItems="center" w='200px' position="relative">
            <SplashedText
              splash="large"
              zIndex="1"            
              animation="1.5s text-highlight linear infinite"
              zIndex="3"
              color={lightTheme.colors.secAccentTextColor}
              fontWeight="bold"
              fontSize="100px"
              splashProps={{
                left: '-140px',
                top: '-130px',
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
          <HStack>
            <LandingSubmitButton href="/firm">
              Try Beta
            </LandingSubmitButton>
            <LandingOutlineButton href="https://docs.inverse.finance/inverse-finance/firm" target="_blank">
              Learn More
            </LandingOutlineButton>
          </HStack>
        </VStack>
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
      <Flex zIndex="1" px="8%" py="20" w="full" bg={lightTheme.colors.mainTextColor} bgColor={lightTheme.colors.mainTextColor} direction="column">
        <ResponsiveStack justifyContent="space-evenly" w='full'>
          <VStack justify="center" h="260px" position="relative">
            <Image borderRadius="999px" src="/assets/v2/landing/placeholder.png" w='200px' h="200px" />
            <Image transform="rotate(43deg)" borderRadius="999px" src="/assets/v2/landing/spike-impact.gif" w='200px' h="200px" position="absolute" left="-60px" />
          </VStack>
          <VStack spacing="4" justify="center" alignItems="flex-start">
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
            <LandingSubmitButton maxW='200px' bgColor="white" color={lightTheme.colors.mainTextColor} href="/whitepaper" target="_blank">
              View Whitepaper
            </LandingSubmitButton>
          </VStack>
        </ResponsiveStack>
      </Flex>
      <Flex px="8%" py="20" w="full" bgImage="/assets/v2/landing/wall.png" bgRepeat="no-repeat" backgroundSize="cover" direction="column" position="relative">
        <VStack alignItems="flex-start" spacing="2" w='full' bgImage="/assets/v2/landing/part2.png" position="relative">
          <SplashedText
            as="h3"
            color={`${lightTheme?.colors.mainTextColor}`}
            fontSize="36px"
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
        <VStack spacing="0" mt="4" position="relative">
          <SplashedText
            splash="cross-dirty"
            containerProps={{ position: 'absolute', left: '-380px', zIndex: '0', bottom: '-200px' }}
            splashProps={{ left: '0', bottom: 0, top: 'inherit', bgColor: lightTheme.colors.accentTextColor, w: '500px', h: '500px' }}
          >
          </SplashedText>
          <ResponsiveStack zIndex="1"  justify="space-between" w='full' spacing="8" alignItems={{ base: 'center', md: 'unset' }}>
            <SimpleCard position="relative" minH="470px" w={{ base: 'full', md: '33%' }} maxW="600px" alignItems="center" justify="space-between">
              <VStack w='full'>
                <Image src="/assets/v2/landing/borrow.png?1" width="full" w="160px" h="150px" mt="6" />
                <Text fontWeight="extrabold" fontSize="30px">Borrow</Text>
                <Text fontSize="18px">
                  Borrow DOLA for a fixed-rate for an unlimited duration with DOLA Borrowing Rights.
                </Text>
              </VStack>
              <LandingSubmitButton href="/firm">
                I want to Borrow
              </LandingSubmitButton>
            </SimpleCard>
            <SimpleCard minH="470px" w={{ base: 'full', md: '33%' }} maxW="600px" alignItems="center" justify="space-between">
              <VStack w='full'>
                <Image src="/assets/v2/landing/earn.png" width="full" w="150px" h="150px" mt="6" />
                <Text fontWeight="extrabold" fontSize="30px">Earn</Text>
                <Text fontSize="18px">
                  Earn attractive returns when you provide liquidity to a trading pair on Curve, Convex, Balancer and others.
                </Text>
              </VStack>
              <LandingSubmitButton href="/yield-opportunities">
                I want to Earn
              </LandingSubmitButton>
            </SimpleCard>
            <SimpleCard minH="470px" w={{ base: 'full', md: '33%' }} maxW="600px" alignItems="center" justify="space-between">
              <VStack w='full'>
                <Image src="/assets/v2/landing/stake.png?" width="full" w="150px" h="150px" mt="6" />
                <Text fontWeight="extrabold" fontSize="30px">Stake</Text>
                <Text fontSize="18px">
                  Buy INV and stake on Frontier with high APY. Participate in Governance.
                </Text>
              </VStack>
              <LandingSubmitButton href="/frontier">
                I want to Stake INV
              </LandingSubmitButton>
            </SimpleCard>
          </ResponsiveStack>
        </VStack>
        <Image zIndex="-1" src="/assets/v2/landing/building4.png" w="300px" position="absolute" bottom="450px" right="-100px" />
        <VStack w='full' alignItems="center" mt="150px" spacing="8">
          <SplashedText
            as="h4"
            color={`${lightTheme?.colors.mainTextColor}`}
            fontSize="36px"
            fontWeight="extrabold"
            splash="horizontal-lr2"
            splashProps={{ w: '400px', h: '100px', left: '-20px', top: '-20px' }}
          >
            Meet our security partners
          </SplashedText>
          <ResponsiveStack pt="4" justify="center" alignItems="center">
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} w={{ base: 'full', md: '60%' }} maxW="800px">
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
            <VStack w={{ base: 'full', md: '40%' }} alignItems="flex-start" spacing='4' pt={{ base: '4', md: '0' }}>
              <Text fontWeight="bold" fontSize="24px">
                Designed from the ground up with security in mind and now backing it up with third party security professionals
              </Text>
              <Text fontSize="20px">
                We know the importance of security, especially for new lending protocols.Read our audit reports or work with us as we expand our third party security efforts.
              </Text>
              <LandingOutlineButton w='200px' href="https://docs.inverse.finance/" target="_blank">
                Learn More
              </LandingOutlineButton>
            </VStack>
          </ResponsiveStack>
        </VStack>
      </Flex>
      <Flex zIndex="1" px="8%" py="10" w="full" bgColor={lightTheme.colors.mainTextColor} direction="column" position="relative">
        <ResponsiveStack justify={{ base: 'space-between', '2xl': 'space-evenly' }}>
          <Text color="white" maxW="600px">
            Inverse Finance invites developers and security researches to take a look at our repos on Github and earn bug bounty rewards.
          </Text>
          <LandingOutlineButton w='200px' boxShadow="none" href="https://docs.inverse.finance/" target="_blank">
            Bug Bounty Program
          </LandingOutlineButton>
        </ResponsiveStack>
      </Flex>
      <VStack spacing="20" px="8%" py="20" w="full"  bgRepeat="no-repeat" backgroundSize="cover" direction="column" position="relative"
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
          <ResponsiveStack w='full' alignItems="center">
            <SplashedText
              as="h3"
              color={`${lightTheme?.colors.mainTextColor}`}
              fontSize="36px"
              fontWeight="extrabold"
              splash="horizontal-rl"
              splashProps={{ right: 0, left: 'inherit', bottom: '-10px', top: 'inherit' }}
            >
              Our Ecosystem
            </SplashedText>
            <LandingSubmitButton w='200px' href="https://discord.gg/YpYJC7R5nv" target="_blank">
              Become a Partner
            </LandingSubmitButton>
          </ResponsiveStack>
          <Ecosystem />
        </VStack>
        <VStack alignItems="flex-start" spacing="2" w='full' py="20"  position="relative">
          <ResponsiveStack w='full' alignItems="center">
            <SplashedText
              as="h3"
              color={`${lightTheme?.colors.mainTextColor}`}
              fontSize="36px"
              fontWeight="extrabold"
              splash="circle"
              splashProps={{ right: '-60px', h: '80px', left: 'inherit', bottom: '-10px', top: 'inherit' }}
            >
              The Stats
            </SplashedText>
            <LandingSubmitButton w='200px' href="/analytics">
              DAO Analytics
            </LandingSubmitButton>
          </ResponsiveStack>
          <Text fontSize="18px">
            Inverse Finance DAO operates unmatched transparency into its operation and governance
          </Text>
          <ResponsiveStack pt="8" w='full' alignItems="center">
            {stats.map(stat => <Stat key={stat.name} {...stat} />)}
          </ResponsiveStack>
        </VStack>
        <VStack alignItems="flex-start" spacing="2" w='full' position="relative">
          <VStack w='full'>
            <ResponsiveStack w='full' alignItems="center" zIndex="1">
              <SplashedText
                as="h3"
                color={`${lightTheme?.colors.mainTextColor}`}
                fontSize="36px"
                fontWeight="extrabold"
                splash="horizontal-wave"
                splashProps={{ w: '600px', h: '50px', right: '-200px', left: 'inherit', bottom: 0, top: 'inherit' }}
              >
                Built For You, Governed By You
              </SplashedText>
              <LandingSubmitButton w='200px' href="/transparency">
                DAO Transparency
              </LandingSubmitButton>
            </ResponsiveStack>
            <Image zIndex="0" src="/assets/v2/landing/building5.png" h='600px' mr="1" position="absolute" right="-200px" top="-120px"/>
          </VStack>
          <ResponsiveStack pt="8" w='full' alignItems="center" justify="space-around" zIndex="1">
            <VStack spacing="0">
              <SimpleCard zIndex="1" spacing="0" p="0">              
                <Image src="/assets/v2/landing/inverse-light.gif" h="300px" w="360px" />
              </SimpleCard>
              <SplashedText
                  splash="cross-dirty"
                  containerProps={{ top: '-60px', left: '-120px', zIndex: '0', position: "absolute" }}
                  splashProps={{ bgColor: lightTheme?.colors.accentTextColor, left: 'inherit', height: '600px', width: '400px' }}
                >
                </SplashedText>
            </VStack>
            <VStack w={{ base: 'full', md: '40%' }} alignItems="flex-start" spacing='4' pt={{ base: '4', md: '0' }}>
              <Text fontWeight="bold" fontSize="24px">
                Inverse Finance DAO operates using a 100% on-chain governance voting model that avoids the pitfalls of centralized DAO governance.
              </Text>
              <Text fontSize="20px">
                We are the most transparent DAO in DeFi with unprecedented levels of operational visibility.
              </Text>
              <Link href="https://www.inverse.finance/blog/posts/en-US/dola-borrowing-rights-dbr-airdrop" fontWeight="bold" color={lightTheme.colors.mainTextColor} textDecoration="underline">
                Airdrop Info >>
              </Link>
              <ResponsiveStack>
                <LandingSubmitButton w='200px' href="https://discord.gg/YpYJC7R5nv" target="_blank">
                  <Image src="/assets/socials/discord.svg" h='10px' mr="1" />
                  Join our Discord
                </LandingSubmitButton>
                <LandingOutlineButton w='200px' href="/governance">
                  View Proposals
                </LandingOutlineButton>
              </ResponsiveStack>
            </VStack>
          </ResponsiveStack>
        </VStack>
        <VStack alignItems="flex-start" spacing="8" w='full' position="relative">
          <ResponsiveStack w='full' alignItems="center" justify="space-between">
            <SplashedText
              as="h3"
              color={`${lightTheme?.colors.mainTextColor}`}
              fontSize="36px"
              fontWeight="extrabold"
              splash="horizontal-rl"
              splashProps={{ w: { base: '100px', md: '400px' }, h: '40px', right: '-20px', left: { base: '0', md: 'inherit' }, bottom: '-10px', top: 'inherit' }}
            >
              Check Out The Latest Alpha...
            </SplashedText>
            <HStack>
              <LandingSubmitButton w='200px' href="https://twitter.com/InverseFinance" target="_blank">
                <Image src="/assets/socials/twitter.svg" h='10px' mr="1" />
                Follow on Twitter
              </LandingSubmitButton>
              <LandingSubmitButton w='120px' href="/blog">
                View Blog
              </LandingSubmitButton>
            </HStack>
          </ResponsiveStack>
          <VStack spacing="0" w='full' alignItems="flex-start">
            <ResponsiveStack overflow="visible" spacing="6" w={{ base: 'full', md: 'auto' }} alignItems={{ base: 'center', md: 'unset' }}>
              {posts.map(post => {
                return <LightPostPreview zIndex="1" key={post.slug} w='300px' {...post} />
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

// export async function getStaticProps(context) {
//   return { ...await getLandingProps(context), revalidate: 60 }
// }

// export async function getStaticPaths() {
//   if(!process.env.CONTENTFUL_SPACE_ID) {
//     return { paths: [], fallback: true }
//   }
//   return {
//     // paths: ['/'],
//     fallback: true,
//   }
// }
