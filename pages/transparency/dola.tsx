import { Flex, HStack, Stack, VStack, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useFedOverview } from '@app/hooks/useDAO'
import { FedList } from '@app/components/Transparency/fed/FedList'
import { usePrices } from '@app/hooks/usePrices'
import { DolaCircSupplyEvolution } from '@app/components/Transparency/DolaCircSupplyEvolution'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { lightTheme } from '@app/variables/theme'
import { InfoMessage, ShrinkableInfoMessage } from '@app/components/common/Messages'
import Link from '@app/components/common/Link'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'
import { DolaSupplies } from '@app/components/common/Dataviz/DolaSupplies'

const LEGEND_ITEMS = [
  {
    color: lightTheme.colors.info,
    label: 'Backed by a Liquidity Position on a AMM',
  },
  {
    color: lightTheme.colors.success,
    label: 'Backed by a collateral on FiRM',
  },
  {
    color: lightTheme.colors.error,
    label: 'Unbacked or mostly unhealthy',
  },
];

const Legend = () => {
  return <HStack w='full' justify="space-around">
    {
      LEGEND_ITEMS.map((item, index) => {
        return <HStack spacing="2" key={item.color}>
          <Text
            minW="1px"
            h="20px"
            borderColor={item.color}
            // borderStyle={EVENT_DASHES[eventType] ? 'dashed' : undefined}
            borderWidth={'2px'}></Text>
          <Text>{item.label}</Text>
        </HStack>
      })
    }
  </HStack>
}

export const DolaDiagram = () => {
  const { themeStyles } = useAppTheme();
  const { dolaSupplies } = useDAO();
  const { markets, isLoading } = useDBRMarkets();
  const { fedOverviews, isLoading: isLoadingOverview } = useFedOverview();
  const { prices } = usePrices(['velodrome-finance']);

  const fedsPieChartData = fedOverviews.map(f => {
    const name = f.type === 'AMM' ?
      `${f.name} ` + (f.subBalances.reduce((acc, curr) => acc ? acc + '-' + curr.symbol : curr.symbol, '') + ' LP')
      : f.name;
    const balance = f.type === 'AMM' ? f.supply : f.borrows;
    const color = ['Frontier', 'Fuse'].includes(f.protocol) ? themeStyles.colors.error : f.protocol === 'FiRM' ? themeStyles.colors.success : themeStyles.colors.info;
    return {
      ...f,
      token: { symbol: name },
      onlyUsdValue: true,
      usdPrice: 1,
      balance: balance,
      sliceName: name,
      sliceValue: balance,
      chartFillColor: color,
      textColor: color,
    }
  }).filter(d => d.sliceValue > 0);

  const firmPieChartData = markets.map(f => {
    return {
      ...f,
      token: { symbol: `FiRM ${f.name}` },
      onlyUsdValue: true,
      usdPrice: 1,
      balance: f.totalDebt,
      sliceName: f.name,
      sliceValue: f.totalDebt,
      chartFillColor: themeStyles.colors.success,
      textColor: themeStyles.colors.success,
    }
  }).filter(d => d.sliceValue > 0);

  const underlyingPieChartData = fedsPieChartData
    .filter(slice => slice.name !== 'FiRM Fed')
    .concat(firmPieChartData);

  const commonProps = {
    dataKey: "sliceValue",
    nameKey: "sliceName",
    activeFill: 'keep',
    chartProps: { activeFill: 'keep', centralFill: themeStyles.colors.mainTextColor }
    // activeSubtextFill: themeStyles.colors.mainTextColor,
  };

  const mainFontSize = { base: '16px', sm: '20px', md: '26px' };
  const dashboardCardTitleProps = { w: 'fit-content', position: 'static', fontSize: mainFontSize, fontWeight: 'extrabold' };
  const dashboardCardProps = { cardTitleProps: dashboardCardTitleProps, direction: 'column', mx: '0', w: { base: '100vw', sm: '95vw', lg: '600px' }, borderRadius: { base: '0', sm: '8' } };

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Dola</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Dola & the Feds" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Dola & the Feds" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, dola, fed, expansion, contraction, supply" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="DOLA & Feds" hideAnnouncement={true} />
      <TransparencyTabs active="dola" />
      <Flex maxW='1300px' w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2">
        <VStack spacing="8">
          <InfoMessage
            description={
              <VStack alignItems="flex-start">
                <Text>DOLA is a decentralized stablecoin soft-pegged to the US Dollar. It is backed by a diversified set of assets, including liquidity positions on AMMs and isolated collaterals on FiRM. Even though it has some bad debt since April 2022, it is being repaid over time and it has operated at peg thanks to strong peg mechanisms.</Text>
                <Link
                  isExternal
                  about="_blank"
                  href={"https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola#dola-usd-peg-management"}>
                  Learn more about peg management
                </Link>
              </VStack>
            }
          />
          <Legend />
          <Stack direction={{ base: 'column', lg: 'row' }} justify="space-between" w='full'>
            <DashBoardCard cardTitle='DOLA backing sources overview' {...dashboardCardProps}>
              <FundsDetails
                {...commonProps}
                leftSideMaxW='300px'
                w='full'
                isLoading={isLoading}
                funds={fedsPieChartData}
                type='balance'
                useRecharts={true}
              />
            </DashBoardCard>
            <DashBoardCard cardTitle='Detailed DOLA backing sources'  {...dashboardCardProps}>
              <FundsDetails
                {...commonProps}
                leftSideMaxW='300px'
                w='full'
                isLoading={isLoading}
                funds={underlyingPieChartData}
                type='balance'
                useRecharts={true}
              />
            </DashBoardCard>
          </Stack>
          <FedList prices={prices} feds={fedOverviews.filter(f => !f.hasEnded)} isLoading={isLoadingOverview} />
          <DolaCircSupplyEvolution />
          <Stack spacing={4} direction={{ base: 'column', lg: 'row' }} >
            <DolaMoreInfos />
            <VStack spacing='4' minW='250px' w='50%' maxW='400px'>
              <DolaSupplies supplies={dolaSupplies.filter(chain => chain.supply > 0)} />
              <ShrinkableInfoMessage
                title="⚡&nbsp;&nbsp;Roles & Powers"
                description={
                  <>
                    <Flex direction="row" w='full' justify="space-between">
                      <Text fontWeight="bold">- Dola operator:</Text>
                      <Text>Add/remove DOLA minters</Text>
                    </Flex>
                    <Flex direction="row" w='full' justify="space-between">
                      <Text fontWeight="bold">- Fed Chair:</Text>
                      <Text>Resize the amount of DOLA supplied</Text>
                    </Flex>
                    <Flex direction="row" w='full' justify="space-between">
                      <Text fontWeight="bold">- Fed Gov:</Text>
                      <Text>Change the Fed Chair</Text>
                    </Flex>
                  </>
                }
              />
            </VStack>
          </Stack>
        </VStack>
      </Flex>
    </Layout >
  )
}

export default DolaDiagram
