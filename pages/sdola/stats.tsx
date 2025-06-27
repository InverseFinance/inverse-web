import { HStack, VStack, Text, SimpleGrid, StackProps, Flex, useMediaQuery, Image } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader';
import { preciseCommify, timestampToUTC } from '@app/util/misc';
import { DolaStakingActivity } from '@app/components/sDola/DolaStakingActivity';
import { useDolaStakingActivity, useDolaStakingEvolution, useStakedDola } from '@app/util/dola-staking';
import { useDBRPrice } from '@app/hooks/useDBR';
import { DolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';
import { SDolaStakingEvolutionChart } from '@app/components/F2/DolaStaking/DolaStakingChart';
import { SkeletonBlob } from '@app/components/common/Skeleton';
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { useEffect, useRef, useState } from 'react';
import { useAppTheme } from '@app/hooks/useAppTheme';
import { TOKEN_IMAGES } from '@app/variables/images';

const ChartCard = (props: StackProps & { cardTitle?: string, subtitle?: string, href?: string, imageSrc?: string }) => {
  return <Flex
    w="full"
    borderRadius={8}
    mt={0}
    p={4}
    position="relative"
    alignItems="center"
    minH="150px"
    shadow="0 0 0px 1px rgba(0, 0, 0, 0.25)"
    bg={'containerContentBackground'}
    direction="column"
    {...props}
  >
    {!!props.imageSrc && <Image  borderRadius="50px" src={props.imageSrc} w={`40px`} h={`40px`} position="absolute" left="10px" top={`10px`} /> }
    {!!props.cardTitle && <Text fontSize="18px" fontWeight="bold" mx="auto" w='fit-content'>{props.cardTitle}</Text>}
    {!!props.subtitle && <Text color="mainTextColorLight" fontSize="16px" fontWeight="bold" mx="auto" w='fit-content'>{props.subtitle}</Text>}
    {props.children}
  </Flex>
}

const MAX_AREA_CHART_WIDTH = 580;

const Chart = (props) => {
  const { isLoading, data } = props;
  const refElement = useRef();
  const [refElementWidth, setRefElementWidth] = useState(MAX_AREA_CHART_WIDTH);
  // const [oldJson, setOldJson] = useState('');
  const [chartWidth, setChartWidth] = useState<number>(MAX_AREA_CHART_WIDTH);
  const [isLargerThan2xl, isLargerThanLg, isLargerThanXs] = useMediaQuery([
    "(min-width: 96em)",
    "(min-width: 62em)",
    "(min-width: 250px)",
  ]);

  useEffect(() => {
    if (!refElement?.current) return;
    setRefElementWidth(refElement.current.clientWidth);
  }, [refElement?.current])

  useEffect(() => {
    const optimal2ColWidth = ((screen.availWidth || screen.width)) / 2 - 50;
    const optimal1ColWidth = ((screen.availWidth || screen.width)) * 0.94 - 50;
    const w = !isLargerThanXs ? 250 : isLargerThan2xl ? MAX_AREA_CHART_WIDTH : isLargerThanLg ? Math.min(optimal2ColWidth, refElementWidth) : optimal1ColWidth;
    setChartWidth(w);
  }, [isLargerThan2xl, isLargerThanXs, isLargerThanLg, screen?.availWidth]);

  if (data?.length < 2) {
    return <SkeletonBlob mt="10" />
  }
  else if (!data) {
    return null;
  }

  // too much flickering when using the responsive container
  return <VStack w='full' ref={refElement}>
    <SDolaStakingEvolutionChart chartWidth={chartWidth} {...props} data={data} />
  </VStack>
}

export const SDolaStatsPage = () => {
  const { themeStyles } = useAppTheme();
  const { events, timestamp } = useDolaStakingActivity(undefined, 'sdola');
  const { evolution, timestamp: lastDailySnapTs, isLoading: isLoadingEvolution } = useDolaStakingEvolution();
  const { priceDola: dbrDolaPrice, priceUsd: dbrPrice } = useDBRPrice();
  const { sDolaSupply, sDolaTotalAssets, apr, apy, apy30d, isLoading } = useStakedDola(dbrPrice);
  const [isInited, setInited] = useState(false);
  const [histoData, setHistoData] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isLoading || isLoadingEvolution || !evolution?.length) return;
    const nowUtcDate = timestampToUTC(now);
    setHistoData(
      evolution
        .filter(d => timestampToUTC(d.timestamp) !== nowUtcDate)
        .concat([
          {
            ...evolution[evolution.length - 1],
            timestamp: Date.now() - (1000 * 120),
            apr,
            apy,
            sDolaTotalAssets,
            sDolaSupply,
          }
        ])
    )
  }, [lastDailySnapTs, isLoadingEvolution, evolution, sDolaTotalAssets, apr, apy, isLoading, now]);

  useEffect(() => {
    setInited(true);
  }, []);

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sDOLA stats</title>
        <meta name="og:title" content="Inverse Finance - sDOLA stats" />
        <meta name="og:description" content="sDOLA stats" />
        <meta name="description" content="sDOLA stats" />
        <meta name="keywords" content="Inverse Finance, sDOLA, yield-bearing stablecoin, staked DOLA, stats" />
      </Head>
      <AppNav active="Stake" activeSubmenu="sDOLA Stats" />
      <DolaStakingTabs defaultIndex={1} />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        maxW="98vw"
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="8" w="100%">
          <ChartCard imageSrc={TOKEN_IMAGES.sDOLA} cardTitle={`sDOLA APY evolution`} subtitle={`(30 day avg: ${apy30d ? shortenNumber(apy30d, 2)+'%' : '-'}, Current: ${apy ? shortenNumber(apy || 0, 2)+'%' : '-'})`}>
            {isInited && <Chart currentValue={apy} isPerc={true} data={histoData} attribute="apy" yLabel="APY" areaProps={{ addDayAvg: true, showLegend: true, legendPosition: 'bottom', avgDayNumbers: [30, 60], avgLineProps: [{ stroke: themeStyles.colors.success, strokeDasharray: '4 4' }, { stroke: themeStyles.colors.warning, strokeDasharray: '4 4' }] }} />}
          </ChartCard>
          <ChartCard imageSrc={TOKEN_IMAGES.sDOLA} subtitle={sDolaTotalAssets > 0 ? `(Current: ${smartShortNumber(sDolaTotalAssets || 0, 2)})` : ''} cardTitle={`DOLA staked in sDOLA`}>
            {isInited && <Chart isLoading={isLoading} currentValue={sDolaTotalAssets} data={histoData} attribute="sDolaTotalAssets" yLabel="DOLA staked" />}
          </ChartCard>
        </SimpleGrid>
        <DolaStakingActivity
          events={events.slice(-100)}
          showInitiator={true}
          lastUpdate={timestamp}
          title="Last 100 sDOLA Staking activity"
          headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
          }}
          right={
            <HStack justify="space-between" spacing="4">
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">sDOLA supply</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">
                      {preciseCommify(sDolaSupply, 2)}
                    </Text>
                }
              </VStack>
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">Total DOLA staked</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">
                      {preciseCommify(sDolaTotalAssets, 2)}
                    </Text>
                }
              </VStack>
            </HStack>
          }
        />
      </VStack>
    </Layout>
  )
}

export default SDolaStatsPage