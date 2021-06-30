import { Flex, Image, Spacer, Stack, Text } from '@chakra-ui/react'
import LinkButton, { LinkOutlineButton } from '@inverse/components/Button'
import Layout from '@inverse/components/Layout'
import { LandingNav } from '@inverse/components/Navbar'
import { useMarkets } from '@inverse/hooks/useMarkets'
import { usePrices } from '@inverse/hooks/usePrices'
import { useProposals } from '@inverse/hooks/useProposals'
import { useTVL } from '@inverse/hooks/useTVL'
import { Proposal } from '@inverse/types'

const projects = [
  '/assets/projects/YFI.svg',
  '/assets/projects/Sushiswap.png',
  '/assets/projects/Lido.png',
  '/assets/projects/Anyswap.png',
  '/assets/projects/Ether.png',
  '/assets/projects/Indexed.png',
  '/assets/projects/Olympus.png',
  '/assets/projects/USDC.png',
  '/assets/projects/DAI.png',
]

const cards = [
  {
    title: 'DCA Vaults',
    description: ' DCA your stablecoin yield into your favorite crypto, including BTC, ETH & YFI.',
    label: 'Open Vaults',
    image: '/assets/products/vaults.png',
    href: '/vaults',
  },
  {
    title: 'Anchor',
    description: 'Capital-efficient lending, borrowing & synthetic assets.',
    label: 'Lend & Borrow',
    image: '/assets/products/anchor.png',
    href: '/anchor',
  },
  {
    title: 'DOLA',
    description: 'Debt-based USD stablecoin for high capital efficiency, leverage and native yield',
    label: 'Swap DOLA',
    image: '/assets/products/dola.png',
    href: '/stabilizer',
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
  const { proposals } = useProposals()
  const { markets } = useMarkets()
  const { prices } = usePrices()
  const { tvl } = useTVL()

  const stats = [
    {
      label: 'TVL',
      value: tvl,
      showDollar: true,
    },
    {
      label: '$INV Price',
      value: prices['inverse-finance'] ? prices['inverse-finance'].usd : 0,
      showDollar: true,
    },
    {
      label: 'Markets',
      value: markets.length,
    },
    {
      label: 'Passed Proposals',
      value: proposals.filter(({ forVotes, againstVotes }: Proposal) => forVotes > againstVotes).length,
    },
    {
      label: 'Votes Casted',
      value: proposals.reduce((prev: number, curr: Proposal) => prev + curr.forVotes + curr.againstVotes, 0),
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
                <Text color="primary">Inverse Finance</Text>
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
            <Text>From a capital-efficient money market, to tokenized synthetic assets,</Text>
            <Text>our mission is to grow your wealth. Start earning with Inverse.</Text>
          </Flex>
          <Flex>
            <Flex w={32} m={2}>
              <LinkButton href="/anchor">Enter App</LinkButton>
            </Flex>
            <Flex w={32} m={2}>
              <LinkOutlineButton href="https://docs.inverse.finance/">Learn More</LinkOutlineButton>
            </Flex>
          </Flex>
          <Text pt={16} fontSize={{ base: 'md', md: 'lg' }} textAlign="center" fontWeight="medium">
            Inverse is proudly partnered with leading cryptocurrency & DeFi protocols
          </Text>
          <Stack direction="row" spacing={0} justify="center" wrap="wrap" shouldWrapChildren>
            {projects.map((project) => (
              <Flex w={16} h={16} m={6}>
                <Image w={16} h={16} src={project} />
              </Flex>
            ))}
          </Stack>
        </Stack>
      </Flex>
      <Stack w={{ base: 'full', xl: 'container.xl' }} mt={{ base: 8, lg: 40 }} p={8}>
        <Text pb={8} fontSize="2xl" fontWeight="bold">
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
              maxW={{ base: 64, lg: 72 }}
              p={10}
              m={4}
              textAlign="center"
              borderRadius={16}
              bgColor="#211e36"
              align="center"
            >
              <Text fontSize="2xl" fontWeight="bold">
                {title}
              </Text>
              <Text h={12} fontSize="sm" fontWeight="medium">
                {description}
              </Text>
              <Spacer />
              <Flex h={48} p={6} align="center" justify="center">
                <Image w={32} h={32} src={image} />
              </Flex>
              <Flex w={40}>
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
        pt={{ base: 8, lg: 64 }}
        pb={{ base: 8, lg: 48 }}
      >
        <Flex w={{ base: 'full', xl: 'container.xl' }} p={8}>
          <Stack w="3xl" spacing={6}>
            <Text fontSize="2xl" fontWeight="bold">
              Join the Inverse DAO - governance by the people
            </Text>
            <Text fontSize="lg">
              Inverse.finance was created by Nour Haridy in December 2020, and since then has grown to include hundreds
              of active DAO members voting on the direction of the organization.
            </Text>
            <Text fontSize="lg">
              Our vision is to establish one of DeFi’s major financial ecosystems giving users of all levels inclusive
              access to meaningful opportunities spanning a variety of innovative, DAO-owned protocols, all governed by
              an empowered INV community.
            </Text>
            <Flex w={32}>
              <LinkButton href="/governance">Join the DAO</LinkButton>
            </Flex>
          </Stack>
        </Flex>
      </Flex>
      <Flex
        position="relative"
        w="full"
        bg="linear-gradient(270deg, #2D002E 0%, rgba(85, 0, 255, 0.7) 50.27%, rgba(99, 26, 247, 0.26) 100%);"
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
        <Text fontSize="2xl" fontWeight="semibold">
          Strength in Numbers
        </Text>
        <Stack
          w="full"
          pt={20}
          pl={{ base: 8, lg: 64 }}
          pr={{ base: 8, lg: 64 }}
          pb={0}
          direction="row"
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
              <Text fontSize="lg">{stat.label}</Text>
            </Stack>
          ))}
        </Stack>
      </Flex>
    </Layout>
  )
}

export default Landing
