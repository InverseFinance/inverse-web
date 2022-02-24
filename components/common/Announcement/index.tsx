import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Text } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/layout'
import Link from '@app/components/common/Link'
import { TEST_IDS } from '@app/config/test-ids';
import { useSupplyBalances } from '@app/hooks/useBalances';
import { OLD_XINV } from '@app/config/constants';
import { utils } from 'ethers'

import { useRouter } from 'next/router';
import { ANNOUNCEMENT_BAR_BORDER } from '@app/theme';

const XinvMigrationMessage = () => {
  const symbol = process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL
  return <>
    <Text>
      x{symbol} migration is in progress. Please withdraw funds from <b>{symbol} (OLD)</b> and resupply them into the new <b>{symbol}</b>
    </Text>
  </>
}

const MessageWithLink = ({ href, msg }: { href: string, msg: string }) => {
  return <Link
    pl={1}
    color="#fff"
    isExternal={href.startsWith('http') ? true : false}
    href={href}
    _hover={{ color: 'primary.100' }}
  >
    {msg}
    <ExternalLinkIcon ml="2" />
  </Link>
}

export const Announcement = ({ isLanding = false }: { isLanding?: boolean }) => {
  const router = useRouter()
  const { balances } = useSupplyBalances()
  const needsXinvMigration = balances && balances[OLD_XINV] && Number(utils.formatEther(balances[OLD_XINV])) > 0.1

  return (
    <Flex
      bgColor={'announcementBarBackgroundColor'}
      background={isLanding ? undefined : "announcementBarBackground"}
      borderBottom={isLanding ? undefined : ANNOUNCEMENT_BAR_BORDER}
      w="full"
      p={1}
      h="60px"
      fontSize="lg"
      justify="center"
      textAlign="center"
      alignItems="center"
      fontWeight="semibold"
      color={'white'}
      cursor="pointer"
      onClick={() => router.push('/inv')}
      data-testid={TEST_IDS.announcement}
    >
      {
        process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK ?
            <MessageWithLink
              href={process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK}
              msg={process.env.NEXT_PUBLIC_ANNOUNCEMENT_MSG!}
            />
          :
          <Text>{process.env.NEXT_PUBLIC_ANNOUNCEMENT_MSG}</Text>
      }
    </Flex>
  )
}

