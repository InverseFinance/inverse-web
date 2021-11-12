import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Flex } from '@chakra-ui/layout'
import Link from '../Link'
import { TEST_IDS } from '@inverse/config/test-ids';

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
      isExternal
      href="https://t.me/InverseCompanionBot"
      _hover={{ color: 'purple.100' }}
      pl={1}
      color="#fff"
      data-testid={TEST_IDS.announcement}
    >
      Track your Anchor position and receive liquidation risk alerts on Telegram using Inverse Companion Bot{' '}
      <ExternalLinkIcon />
    </Link>
  </Flex>
)
