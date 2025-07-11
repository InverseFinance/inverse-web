import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Text, Image } from '@chakra-ui/react'
import { Flex, HStack, VStack } from '@chakra-ui/layout'
import Link from '@app/components/common/Link'

import { useAppTheme, useAppThemeParams } from '@app/hooks/useAppTheme';
import { shortenNumber } from '@app/util/markets';
import { SmallTextLoader } from '../Loaders/SmallTextLoader';
import { useCustomSWR } from '@app/hooks/useCustomSWR';
import { useMemo } from 'react';

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
  const { data: apiData, error: apiErr } = useCustomSWR(`/api/dola-staking?v=2&cacheFirst=true&includeSpectra=true`);
  const spectraPool = apiData?.spectraPool;
  const sDolaApy = apiData?.apy;

  const highestApy = sDolaApy;
  // const highestApy = useMemo(() => {
  //   return Math.max(sDolaApy, spectraPool?.apy || 0);
  // }, [sDolaApy, spectraPool]);

  const isSpectraCase = false;
  // const isSpectraCase = useMemo(() => {
  //   return highestApy === spectraPool?.apy;
  // }, [highestApy, spectraPool]);

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
        href={isSpectraCase ? spectraPool.pool : '/sDOLA'}
        target={isSpectraCase ? '_blank' : '_self'}
        isExternal={isSpectraCase}
        _hover={{ color: 'lightAccentTextColor' }}
      >
        <VStack spacing="0">
          {
            highestApy > 0 ?
              <HStack textDecoration="underline" spacing="1">
                <Text className="heading-font">Get <b style={{ fontWeight: 'extrabold', fontSize: '18px', color: themeStyles.colors.accentTextColor }}>{shortenNumber(highestApy, 2)}%</b>{isSpectraCase ? ' Fixed ' : ' '}APY with sDOLA{isSpectraCase ? ' on Spectra' : ''}</Text>
                <Image borderRadius="full" src="/assets/sDOLAx128.png" h="20px" w="20px" />
              </HStack>
              : <SmallTextLoader />
          }
        </VStack>
      </Link>
    </Flex>
  )
}

