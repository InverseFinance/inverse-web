import { ExternalLinkIcon, WarningIcon } from '@chakra-ui/icons'
import { Text } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/layout'
import Link from '../Link'
import { TEST_IDS } from '@inverse/config/test-ids';
import { useSupplyBalances } from '@inverse/hooks/useBalances';
import { OLD_XINV } from '@inverse/config/constants';

const DefaultMessage = () => {
  return <Link
    pl={1}
    color="#fff"
    isExternal
    href="https://t.me/InverseCompanionBot"
    _hover={{ color: 'purple.100' }}
  >
    Track your Anchor position and receive liquidation risk alerts on Telegram using Inverse Companion Bot{' '}
    <ExternalLinkIcon />
  </Link>
}

const XinvMigrationMessage = () => {
  return <>
    <WarningIcon color="orange.400" mr="2" />
    <Text>xINV is <b>migrating</b> ! Please withdraw funds from <b>INV (OLD)</b>, you can then resupply in the new <b>INV</b> 🙂</Text>
  </>
}

export const Announcement = () => {
  const { balances } = useSupplyBalances()
  const needsXinvMigration = balances && balances[OLD_XINV]?.gt(0)

  return (
    <Flex
      bgColor="purple.600"
      w="full"
      p={1}
      fontSize="sm"
      justify="center"
      textAlign="center"
      alignItems="center"
      fontWeight="semibold"
      color="#fff"
      data-testid={TEST_IDS.announcement}
    >
      {
        needsXinvMigration ? <XinvMigrationMessage /> : <DefaultMessage />
      }
    </Flex>
  )
}
