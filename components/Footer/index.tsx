import { Image, Link, Stack, Text } from '@chakra-ui/react'
import Logo from '@inverse/components/Logo'

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

export const Footer = () => (
  <Stack
    w="full"
    direction={{ base: 'column', lg: 'row' }}
    backgroundColor="purple.900"
    borderColor="purple.800"
    borderTopWidth={1}
    spacing={8}
    p={4}
    pl={{ base: 4, lg: 16 }}
    pr={{ base: 4, lg: 16 }}
    justify="space-around"
    color="#fff"
  >
    <Stack width={{ base: 'full', lg: 72 }} spacing={4}>
      <Stack direction="row" align="center">
        <Logo boxSize={7} />
        <Text fontWeight="bold">Inverse Finance</Text>
      </Stack>
      <Text fontSize="13px">
        Inverse is building a suite of DeFi tools. Everything we do is a community effort, which means you too can
        participate in the decision-making process. Join us!
      </Text>
      <Stack direction="row" spacing={5} align="center">
        {INVERSE_SOCIALS.map(({ href, image }) => (
          <Link href={href}>
            <Image src={image} />
          </Link>
        ))}
      </Stack>
    </Stack>
    <Stack
      justify={{ base: 'flex-start', lg: 'space-around' }}
      spacing={{ base: 0, lg: 16 }}
      direction="row"
      wrap="wrap"
      shouldWrapChildren
    >
      <Stack w={32} mb={4}>
        <Text fontWeight="bold">Products</Text>
        <Link fontSize="13px" href="#">
          Anchor
        </Link>
        <Link fontSize="13px" href="#">
          Vaults
        </Link>
        <Link fontSize="13px" href="#">
          DOLA
        </Link>
      </Stack>
      <Stack w={32} mb={4}>
        <Text fontWeight="bold">Support</Text>
        <Link fontSize="13px" href="#">
          Docs
        </Link>
        <Link fontSize="13px" href="#">
          Discord
        </Link>
        <Link fontSize="13px" href="#">
          Telegram
        </Link>
      </Stack>
      <Stack w={32} mb={4}>
        <Text fontWeight="bold">Governance</Text>
        <Link fontSize="13px" href="#">
          Voting
        </Link>
        <Link fontSize="13px" href="#">
          Snapshot
        </Link>
        <Link fontSize="13px" href="#">
          Tally
        </Link>
      </Stack>
    </Stack>
  </Stack>
)

export default Footer
