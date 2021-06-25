import { Image, Stack, Text } from '@chakra-ui/react'
import Link from '@inverse/components/Link'
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

const LINK_GROUPS = [
  {
    groupLabel: 'Products',
    items: [
      {
        label: 'Anchor',
        href: '/anchor',
      },
      {
        label: 'Vaults',
        href: '/vaults',
      },
      {
        label: 'DOLA',
        href: '/stabilizer',
      },
    ],
  },
  {
    groupLabel: 'Governance',
    items: [
      {
        label: 'Voting',
        href: '/governance',
      },
      {
        label: 'Snapshot',
        href: 'https://snapshot.org/#/inversefinance.eth',
      },
      {
        label: 'Tally',
        href: 'https://www.withtally.com/governance/inverse',
      },
    ],
  },
  {
    groupLabel: 'Support',
    items: [
      {
        label: 'Docs',
        href: 'https://docs.inverse.finance/',
      },
      {
        label: 'Discord',
        href: 'https://discord.gg/YpYJC7R5nv',
      },
      {
        label: 'Telegram',
        href: 'https://t.me/InverseFinance',
      },
    ],
  },
]

export const Footer = () => (
  <Stack w="full" direction={{ base: 'column', lg: 'row' }} spacing={8} p={8} justify="space-around" color="#fff">
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
        {INVERSE_SOCIALS.map(({ href, image }, i) => (
          <Link key={i} href={href}>
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
      {LINK_GROUPS.map(({ groupLabel, items }) => (
        <Stack key={groupLabel} w={32} mb={4}>
          <Text fontWeight="bold">{groupLabel}</Text>
          {items.map(({ label, href }, i) => (
            <Link key={i} href={href} fontSize="13px">
              {label}
            </Link>
          ))}
        </Stack>
      ))}
    </Stack>
  </Stack>
)

export default Footer
