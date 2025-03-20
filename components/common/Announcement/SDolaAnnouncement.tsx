import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Text, Image } from '@chakra-ui/react'
import { Flex, HStack, VStack } from '@chakra-ui/layout'
import Link from '@app/components/common/Link'

import { useStakedDola } from '@app/util/dola-staking';
import { useDBRPrice } from '@app/hooks/useDBR';
import { useAppTheme, useAppThemeParams } from '@app/hooks/useAppTheme';
import { shortenNumber } from '@app/util/markets';
import { SmallTextLoader } from '../Loaders/SmallTextLoader';
import useSWR from 'swr';
import { useCustomSWR } from '@app/hooks/useCustomSWR';

const MessageWithLink = ({ href, msg }: { href: string, msg: string }) => {
  return <Link
    pl={1}
    color="mainTextColor"
    isExternal={href.startsWith('http') ? true : false}
    href={href}
    _hover={{ color: 'lightAccentTextColor' }}
    display="inline-block"
  >
    {msg}
    <ExternalLinkIcon display="inline-block" ml="2" />
  </Link>
}

export const SDolaAnnouncement = () => {
  const { themeStyles } = useAppTheme();
  const { ANNOUNCEMENT_BAR_BORDER } = useAppThemeParams();
  const { data: apiData, error: apiErr } = useCustomSWR(`/api/dola-staking?cacheFirst=true`);
  const sDolaApy = apiData?.apy;
  return (
    <Flex
      bgColor={'announcementBarBackgroundColor'}
      background={"announcementBarBackground"}
      borderBottom={ANNOUNCEMENT_BAR_BORDER}
      w="full"
      p={1}
      h="60px"
      fontSize="lg"
      justify="center"
      textAlign="center"
      alignItems="center"
      fontWeight="semibold"
      color={'mainTextColor'}
      cursor="pointer"
    >
      <Link
        color="mainTextColor"
        href="/sDOLA"
        _hover={{ color: 'lightAccentTextColor' }}
      >
        <VStack spacing="0">
          {
            sDolaApy > 0 ?
              <HStack textDecoration="underline" spacing="1">
                <Text>Get <b style={{ fontWeight: 'extrabold', fontSize: '18px', color: themeStyles.colors.accentTextColor }}>{shortenNumber(sDolaApy, 2)}%</b> APY with sDOLA</Text>
                <Image borderRadius="full" src="/assets/sDOLAx128.png" h="20px" w="20px" />
              </HStack>
              : <SmallTextLoader />
          }
        </VStack>
      </Link>
    </Flex>
  )
}

