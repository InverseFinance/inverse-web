import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Box, Text } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/layout'
import Link from '@app/components/common/Link'
import { TEST_IDS } from '@app/config/test-ids';
import { useSupplyBalances } from '@app/hooks/useBalances';
import { OLD_XINV } from '@app/config/constants';
import { utils } from 'ethers'

import { PlusAnimIcon } from '@app/components/common/Animation/PlusAnim';
import { useRouter } from 'next/router';
import { LaunchAnim } from '@app/components/common/Animation';

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
    _hover={{ color: 'purple.100' }}
  >
    {msg}
    <ExternalLinkIcon ml="2" />
  </Link>
}

export const Announcement = ({ isLanding = false }: { isLanding: boolean }) => {
  const router = useRouter()
  const { balances } = useSupplyBalances()
  const needsXinvMigration = balances && balances[OLD_XINV] && Number(utils.formatEther(balances[OLD_XINV])) > 0.1

  return (
    <Flex
      bgColor={'transparent'}
      backgroundImage={isLanding ? undefined : "/assets/landing/graphic1.png"}
      borderBottom={isLanding ? undefined : "1px solid #221d45"}
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
      onClick={() => router.push('/governance/proposals/mills/6')}
      data-testid={TEST_IDS.announcement}
    >
      {/* {
        process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK ?
          needsXinvMigration ?
            <XinvMigrationMessage />
            :
            <MessageWithLink
              // href={process.env.NEXT_PUBLIC_ANNOUNCEMENT_LINK}
              // msg={process.env.NEXT_PUBLIC_ANNOUNCEMENT_MSG!}
              href="/inv"
              msg="INV+ is Launched 🚀 ! Learn more"
            />
          :
          <Text>{process.env.NEXT_PUBLIC_ANNOUNCEMENT_MSG}</Text>
      } */}
      <PlusAnimIcon boxProps={{ mr: '4' }} width={30} height={30} loop={true} />
      {/* <Countdown /> */}
      <Box mx="20">
        <LaunchAnim width={30} height={30} loop={true} />
        <Text fontSize="12px">INV+ is Launched!</Text>
      </Box>
      <PlusAnimIcon boxProps={{ ml: '4' }} width={30} height={30} loop={true} />
    </Flex>
  )
}

