import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex } from '@chakra-ui/layout'
import Link from '../Link'

export const Announcement = () => (
  <Flex
    bgColor="purple.600"
    w="full"
    p={1}
    fontSize="sm"
    justify="center"
    textAlign="center"
    fontWeight="semibold"
    color="#fff"
  >
    <Link
      pl={1}
      color="#fff"
      isExternal
      href="https://t.me/InverseCompanionBot"
      _hover={{ color: 'purple.100' }}
    >
      Track your Anchor position and receive liquidation risk alerts on Telegram using Inverse Companion Bot{' '}
      <ExternalLinkIcon />
    </Link>
  </Flex>
)
