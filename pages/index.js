import { Flex, Image, Link, Spacer, Stack, Text } from '@chakra-ui/react'

const INVERSE_PRODUCTS = [
  {
    name: 'Anchor',
    description:
      'A money-market protocol that facilitates capital efficient L&B via the issuance of synthetic tokens and non-synthetic credit',
    logo: '/assets/products/anchor.png',
    buttonLabel: 'Go to Anchor',
  },
  {
    name: 'DOLA',
    description:
      'A money-market protocol that facilitates capital efficient L&B via the issuance of synthetic tokens and non-synthetic credit',
    logo: '/assets/products/dola.png',
    buttonLabel: 'Go to Stabilizer',
  },
  {
    name: 'Vaults',
    description: 'Generate yield on your stablecoins and DCA it into a target token of your choice',
    logo: '/assets/products/vaults.png',
    buttonLabel: 'Go to Vaults',
  },
  {
    name: 'Govern',
    description: 'Become a part of the DAO and help us govern the direction of Inverse products',
    logo: '/assets/products/vote.png',
    buttonLabel: 'Go to Govern',
  },
]

const INVERSE_SOCIALS = [
  {
    href: 'https://twitter.com/InverseFinance',
    image: '/assets/socials/twitter.svg',
  },
  {
    href: 'https://discord.gg/YpYJC7R5nv',
    image: '/assets/socials/discord.svg',
  },
  {
    href: 'https://t.me/InverseFinance',
    image: '/assets/socials/telegram.svg',
  },
  {
    href: 'https://medium.com/inversefinance',
    image: '/assets/socials/medium.svg',
  },
  {
    href: 'https://github.com/InverseFinance',
    image: '/assets/socials/github.svg',
  },
  {
    href: 'https://defipulse.com/inverse',
    image: '/assets/socials/defipulse.svg',
  },
]

const InverseLink = ({ children }) => (
  <Text transition="color 500ms ease-out" _hover={{ color: '#20D5DC' }} cursor="pointer">
    {children}
  </Text>
)

const InverseButton = ({ children }) => (
  <Flex
    bgColor="#100e21"
    shadow="0px 0px 5px 2px #20D5DC"
    border="2px solid #20D5DC"
    textShadow="0 0 1px #20D5DC, 0 0 2px #20D5DC"
    p={2}
    pl={6}
    pr={6}
    borderRadius={32}
    cursor="pointer"
    transition="color 500ms ease-out"
    _hover={{ color: '#20D5DC' }}>
    <Text fontSize="sm" fontWeight={600}>
      {children}
    </Text>
  </Flex>
)

const InverseProduct = ({ product }) => {
  const { name, description, logo, buttonLabel } = product
  return (
    <Stack width={64} align="center" textAlign="center">
      <Image src={logo} height={56} width={56} />
      <Text fontWeight={800} fontSize="3xl" lineHeight={1}>
        {name}
      </Text>
      <Text>{description}</Text>
      <Spacer />
      <InverseButton>{buttonLabel}</InverseButton>
    </Stack>
  )
}

export default function Home() {
  return (
    <Flex bgColor="darkestSlateBlue" direction="column" width="full" align="center">
      <Flex
        direction="column"
        bgGradient="linear(to-b, darkestSlateBlue, darkestSlateBlue, darkestSlateBlue, darkestSlateBlue, darkerSlateBlue, darkerSlateBlue)"
        width="full"
        align="center"
        justify="center">
        <Flex
          width="full"
          justify="space-between"
          align="center"
          color="white"
          mt={6}
          pl={6}
          pr={6}>
          <Stack direction="row" align="center">
            <Image
              src="/assets/inverse.png"
              width={10}
              height={10}
              filter="brightness(0) invert(1)"
            />
            <Text fontWeight={800} fontSize="lg">
              Inverse
            </Text>
          </Stack>
          <Stack direction="row" spacing={12} fontWeight={500} align="center">
            <InverseLink>Docs</InverseLink>
            <InverseLink>Analytics</InverseLink>
            <InverseButton>Enter App</InverseButton>
          </Stack>
        </Flex>
        <Flex
          bgImage="/assets/home/main1.png"
          bgRepeat="no-repeat"
          bgPosition="center center"
          direction="column"
          mt={16}
          height={850}
          align="center"
          justify="space-between"
          color="white"
          width="full">
          <Stack mt={28} ml="42rem" w="3xl" spacing={4}>
            <Text lineHeight={1} fontSize="6xl" fontWeight="900">
              Invading the Traditional Financial System
            </Text>
            <Text fontSize="xl">
              Inverse is building a suite of DeFi tools, governed by one of the most active DAO in
              the space. From a capital-efficient money market, to tokenized synthetic assets,
              traditional finance is about to be invaded.
            </Text>
            <Stack direction="row" spacing={4}>
              <InverseButton>Enter App</InverseButton>
              <InverseButton>Learn More</InverseButton>
            </Stack>
          </Stack>
        </Flex>
      </Flex>
      <Stack
        width="full"
        direction="row"
        pl={16}
        pr={16}
        mt={16}
        mb={8}
        color="white"
        justify="space-around">
        <Stack
          width="8xl"
          direction="row"
          justify="space-around"
          align="center"
          spacing={0}
          wrap="wrap"
          shouldWrapChildren>
          <Stack direction="row" spacing={8} align="center">
            <Image src="/assets/home/main2.png" height={40} width={40} />
            <Stack>
              <Text fontSize="4xl" fontWeight={700} lineHeight={1}>
                $2,009,366,701.83
              </Text>
              <Text fontSize="lg">Total Value Locked (TVL)</Text>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={8} align="center">
            <Image src="/assets/home/main2.png" height={40} width={40} />
            <Stack>
              <Text fontSize="4xl" fontWeight={700} lineHeight={1}>
                $2,009,366,701.83
              </Text>
              <Text fontSize="lg">Total Value Locked (TVL)</Text>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={8} align="center">
            <Image src="/assets/home/main2.png" height={40} width={40} />
            <Stack>
              <Text fontSize="4xl" fontWeight={700} lineHeight={1}>
                $2,009,366,701.83
              </Text>
              <Text fontSize="lg">Total Value Locked (TVL)</Text>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={8} align="center">
            <Image src="/assets/home/main2.png" height={40} width={40} />
            <Stack>
              <Text fontSize="4xl" fontWeight={700} lineHeight={1}>
                $2,009,366,701.83
              </Text>
              <Text fontSize="lg">Total Value Locked (TVL)</Text>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={8} align="center">
            <Image src="/assets/home/main2.png" height={40} width={40} />
            <Stack>
              <Text fontSize="4xl" fontWeight={700} lineHeight={1}>
                $2,009,366,701.83
              </Text>
              <Text fontSize="lg">Total Value Locked (TVL)</Text>
            </Stack>
          </Stack>
        </Stack>
        <Image src="/assets/home/main2.png" height="xl" width="xl" />
      </Stack>
      <Flex
        mb={8}
        direction="column"
        bgImage="/assets/home/main3.png"
        bgPosition="center center"
        width="full"
        align="center"
        justify="center">
        <Flex
          width="full"
          justify="space-around"
          p={48}
          fontSize="md"
          color="white"
          bgGradient="linear(to-b, darkestSlateBlue, transparent, transparent, transparent, darkestSlateBlue)">
          {INVERSE_PRODUCTS.map((product) => (
            <InverseProduct product={product} />
          ))}
        </Flex>
      </Flex>
      <Flex
        width="full"
        borderTop="1px solid #423984"
        backgroundColor="darkestSlateBlue"
        justify="space-between"
        p={2}
        pl={6}
        pr={6}
        color="white"
        align="center"
        fontWeight={700}>
        <Stack direction="row" align="center">
          <Image src="/assets/inverse.png" width={7} height={7} filter="brightness(0) invert(1)" />
          <Text>Inverse</Text>
        </Stack>
        <Stack direction="row" spacing={4} align="center">
          {INVERSE_SOCIALS.map(({ href, image }) => (
            <Link href={href}>
              <Image src={image} />
            </Link>
          ))}
        </Stack>
      </Flex>
    </Flex>
  )
}
