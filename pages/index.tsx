// TODO: Clean up the landing page, this was rushed in a few hours
import { Flex, Image, Spacer, Stack, Text } from '@chakra-ui/react'
import LinkButton, { LinkOutlineButton } from '@inverse/components/common/Button'
import Layout from '@inverse/components/common/Layout'
import { LandingNav } from '@inverse/components/common/Navbar'
import { TEST_IDS } from '@inverse/config/test-ids'
import { useDAO } from '@inverse/hooks/useDAO'
import { usePrices } from '@inverse/hooks/usePrices'
import { useTVL } from '@inverse/hooks/useTVL'

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
    title: 'DOLA',
    description: 'Debt-based USD stablecoin for high capital efficiency, leverage and native yield',
    label: 'Swap DOLA',
    image: '/assets/products/dola.png',
    href: '/stabilizer',
  },
  {
    title: 'Anchor',
    description: 'Capital-efficient lending, borrowing & synthetic assets.',
    label: 'Lend & Borrow',
    image: '/assets/products/anchor.png',
    href: '/anchor',
  },
  {
    title: 'DCA Vaults',
    description: ' DCA your stablecoin yield into your favorite crypto, including BTC, ETH & YFI.',
    label: 'Open Vaults',
    image: '/assets/products/vaults.png',
    href: '/vaults',
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
  const { dolaTotalSupply } = useDAO()
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
      value: dolaTotalSupply,
      showDollar: true,
    },
    {
      label: '$INV Price',
      value: prices['inverse-finance'] ? prices['inverse-finance'].usd : 0,
      showDollar: true,
    },
  ]

  return (
    <Layout>
      <Flex w="full" bgImage="/assets/landing/graphic1.png" bgRepeat="no-repeat" direction="column">
        <LandingNav />
        <Stack w="full" align="center" mt={{ base: 4, md: 28 }} spacing={4} p={2}>
          <Flex direction="column">
            <Text color="secondary" fontWeight="bold">
              Invert the System
            </Text>
            <Flex
              direction="column"
              fontSize={{ base: '3xl', md: '7xl' }}
              fontWeight="bold"
              lineHeight="shorter"
              textAlign="center"
            >
              <Text>Borrow, Lend & Earn</Text>
              <Stack direction="row">
                <Text>with</Text>
                <Text color="secondary">Inverse Finance</Text>
              </Stack>
            </Flex>
          </Flex>
          <Flex
            direction="column"
            textAlign="center"
            fontSize={{ base: 'md', md: 'xl' }}
            lineHeight={{ base: 'base', md: 'shorter' }}
            fontWeight="medium"
          >
            <Text>Welcome to Inverse, part of the new wave of decentralized banking & finance.</Text>
            <Text display={{ base: 'none', sm: 'inline' }}>
              From a capital-efficient money market, to tokenized synthetic assets,
            </Text>
            <Text display={{ base: 'none', sm: 'inline' }}>
              our mission is to grow your wealth. Start earning with Inverse.
            </Text>
          </Flex>
          <Flex>
            <Flex w={32} m={2}>
              <LinkButton data-testid={TEST_IDS.landing.enterBtn} target="_self" href="/anchor">Enter App</LinkButton>
            </Flex>
            <Flex w={32} m={2}>
              <LinkOutlineButton data-testid={TEST_IDS.landing.learnMore} target="_self" href="https://docs.inverse.finance/">Learn More</LinkOutlineButton>
            </Flex>
          </Flex>
          <Text pt={16} fontSize={{ base: 'md', md: 'lg' }} textAlign="center" fontWeight="medium">
            Inverse is proudly partnered with leading cryptocurrency & DeFi protocols
          </Text>
          <Stack pt={4} direction="row" spacing={0} justify="center" wrap="wrap" shouldWrapChildren>
            {projects.map((project) => (
              <Flex key={project} w={16} h={16} m={6}>
                <Image w={16} h={16} src={project} />
              </Flex>
            ))}
          </Stack>
        </Stack>
      </Flex>
      <Stack w={{ base: 'full', xl: 'container.xl' }} mt={{ base: 8, lg: 24 }} p={8}>
        <Text pb={8} fontSize="2xl" fontWeight="bold" textAlign={{ base: 'center', lg: 'start' }}>
          A suite of banking tools for the DeFi generation
        </Text>
        <Stack
          w="full"
          direction="row"
          justify={{ base: 'center', lg: 'space-between' }}
          spacing={0}
          wrap="wrap"
          shouldWrapChildren
        >
          {cards.map(({ title, description, label, image, href }) => (
            <Stack
              key={title}
              p={8}
              m={4}
              textAlign="center"
              borderRadius={16}
              bgColor="purple.800"
              align="center"
              shadow="dark-lg"
            >
              <Text fontSize="2xl" fontWeight="bold">
                {title}
              </Text>
              <Text w={{ base: 56, lg: 64 }} h={12} fontSize="sm" fontWeight="medium">
                {description}
              </Text>
              <Spacer />
              <Flex w={40} pt={6}>
                <LinkButton href={href}>{label}</LinkButton>
              </Flex>
            </Stack>
          ))}
        </Stack>
      </Stack>
      <Flex
        w="full"
        bgImage="/assets/landing/graphic2.png"
        bgRepeat="no-repeat"
        bgPosition="right top"
        justify="center"
        pt={{ base: 8, lg: 32 }}
        pb={{ base: 8, lg: 32 }}
      >
        <Flex w={{ base: 'full', xl: 'container.xl' }} p={8} textAlign={{ base: 'center', lg: 'start' }}>
          <Stack w="3xl" spacing={6} align={{ base: 'center', lg: 'flex-start' }}>
            <Text fontSize="2xl" fontWeight="bold">
              Join the Inverse DAO - governance by the people
            </Text>
            <Text fontSize="lg">
              Inverse.finance was created by a sole developer in December 2020, and since then has grown to include
              hundreds of active DAO members voting on the direction of the organization.
            </Text>
            <Text fontSize="lg">
              Our vision is to establish one of DeFi’s major financial ecosystems giving users of all levels inclusive
              access to meaningful opportunities spanning a variety of innovative, DAO-owned protocols, all governed by
              an empowered INV community.
            </Text>
            <Flex w={32}>
              <LinkButton href="https://discord.gg/YpYJC7R5nv">Join the DAO</LinkButton>
            </Flex>
          </Stack>
        </Flex>
      </Flex>
      <Flex
        position="relative"
        w="full"
        bgGradient="linear(to-bl, #2a2557 0%, #191633 100%);"
        align="center"
        direction="column"
        pt={{ base: 16, lg: 32 }}
        pb={{ base: 16, lg: 32 }}
        mb={-6}
      >
        <Flex
          position="absolute"
          bgImage="/assets/landing/graphic3.png"
          bgRepeat="no-repeat"
          bgSize="100% 100%"
          w="full"
          h="full"
          top={0}
          left={0}
        ></Flex>
        <Stack
          w="full"
          pl={{ base: 8, lg: 16, xl: 32 }}
          pr={{ base: 8, lg: 16, xl: 32 }}
          pb={0}
          direction={{ base: 'column', md: 'row' }}
          spacing={0}
          wrap="wrap"
          shouldWrapChildren
          justify="space-around"
        >
          {stats.map((stat) => (
            <Stack key={stat.label} align="center" m={4}>
              <Text fontSize="5xl" fontWeight="bold" lineHeight={1}>
                {formatStat(stat)}
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="purple.100">
                {stat.label}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Flex>
    </Layout>
  )
}

export default Landing
