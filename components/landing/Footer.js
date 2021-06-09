import { Flex, Image, Link, Stack, Text } from '@chakra-ui/react'

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
    width="full"
    borderTop="2px solid #211c42"
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
)

export default Footer
