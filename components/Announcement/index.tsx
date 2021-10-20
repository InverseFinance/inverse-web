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
      href="https://twitter.com/InverseFinance/status/1449403645322215426"
      _hover={{ color: 'purple.100' }}
    >
      Inverse is looking for trusted DeFi community members to join its Cross-Chain Fed Oversight Board{' '}
      <ExternalLinkIcon />
    </Link>
  </Flex>
)
