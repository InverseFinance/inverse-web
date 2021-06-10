import { Flex, Image, Link, Stack, Text } from '@chakra-ui/react'
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
  <Flex
    w="full"
    backgroundColor="purple.900"
    borderColor="purple.700"
    borderTopWidth={2}
    justify="space-between"
    p={2}
    align="center">
    <Stack direction="row" align="center">
      <Logo boxSize={7} />
      <Text fontWeight="semibold">Inverse</Text>
    </Stack>
    <Stack direction="row" spacing={3} align="center">
      {INVERSE_SOCIALS.map(({ href, image }) => (
        <Link href={href}>
          <Image src={image} />
        </Link>
      ))}
    </Stack>
  </Flex>
)

export default Footer
