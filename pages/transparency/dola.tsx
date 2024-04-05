import { Flex, SimpleGrid, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useFedOverview } from '@app/hooks/useDAO'
import { FedList } from '@app/components/Transparency/fed/FedList'
import { usePrices } from '@app/hooks/usePrices'
import { DolaCircSupplyEvolution } from '@app/components/Transparency/DolaCircSupplyEvolution'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { FundsDetails } from '@app/components/Transparency/FundsDetails'

export const DolaDiagram = () => {
  const { themeStyles } = useAppTheme();
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
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2">
        <VStack spacing="8">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacingX="8">
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
          </SimpleGrid>
          <FedList prices={prices} feds={fedOverviews.filter(f => !f.hasEnded)} isLoading={isLoadingOverview} />
          <DolaCircSupplyEvolution />
        </VStack>
        {/* <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          <DolaMoreInfos />
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
        </VStack> */}
      </Flex>
    </Layout >
  )
}

export default DolaDiagram
