import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useFedOverview } from '@app/hooks/useDAO'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'
import { FedList } from '@app/components/Transparency/fed/FedList'
import { usePrices } from '@app/hooks/usePrices'
import { DolaSupplies } from '@app/components/common/Dataviz/DolaSupplies'
import { DolaCircSupplyEvolution } from '@app/components/Transparency/DolaCircSupplyEvolution'
import { PieChartRecharts } from '@app/components/Transparency/PieChartRecharts'
import { shortenNumber } from '@app/util/markets'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { useDBRMarkets } from '@app/hooks/useDBR'

export const DolaDiagram = () => {
  const { themeStyles } = useAppTheme();
  const { dolaSupplies } = useDAO();
  const { markets } = useDBRMarkets();
  const { fedOverviews, isLoading: isLoadingOverview } = useFedOverview();
  const { prices } = usePrices(['velodrome-finance']);

  const fedsPieChartData = fedOverviews.map(f => {
    return {
      ...f,
      sliceName: f.type === 'AMM' ? (f.subBalances.reduce((acc, curr) => acc ? acc + '-' + curr.symbol : curr.symbol, '') + ' LP') : f.name,
      sliceValue: f.type === 'AMM' ? f.supply : f.borrows,
      fillColor: ['Frontier', 'Fuse'].includes(f.protocol) ? themeStyles.colors.error : themeStyles.colors.info,
    }
  }).filter(d => d.sliceValue > 0);

  const fedsTotal = fedsPieChartData.reduce((acc, curr) => acc + (curr.sliceValue || 0), 0);

  const firmPieChartData = markets.map(f => {
    return {
      ...f,
      sliceName: f.name,
      sliceValue: f.totalDebt,
      fillColor: themeStyles.colors.info,
    }
  }).filter(d => d.sliceValue > 0);

  const underlyingPieChartData = fedsPieChartData
    .filter(slice => slice.name !== 'FiRM Fed')
    .concat(firmPieChartData);

  const firmTotal = firmPieChartData.reduce((acc, curr) => acc + (curr.sliceValue || 0), 0);

  const commonProps = {
    dataKey: "sliceValue",
    nameKey: "sliceName",
    activeFill: themeStyles.colors.mainTextColor,
    activeSubtextFill: themeStyles.colors.mainTextColor,
  };

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
        <Flex direction="column">
          <DashBoardCard cardTitle='DOLA backing by Feds'>
            <PieChartRecharts
              data={fedsPieChartData}
              {...commonProps}
              centralValue={shortenNumber(fedsTotal, 2)}
            />
          </DashBoardCard>
          <DashBoardCard cardTitle='FiRM DOLA backing'>
            <PieChartRecharts
              data={underlyingPieChartData}
              centralValue={shortenNumber(fedsTotal, 2)}
              {...commonProps}
            />
          </DashBoardCard>
          <DashBoardCard cardTitle='FiRM DOLA backing'>
            <PieChartRecharts
              data={underlyingPieChartData}
              centralValue={shortenNumber(fedsTotal, 2)}
              {...commonProps}
            />
          </DashBoardCard>
          <DashBoardCard cardTitle='FiRM DOLA backing'>
            <PieChartRecharts
              data={firmPieChartData}
              centralValue={shortenNumber(firmTotal, 2)}
            />
          </DashBoardCard>
          <FedList prices={prices} feds={fedOverviews.filter(f => !f.hasEnded)} isLoading={isLoadingOverview} />
          <DolaCircSupplyEvolution />
        </Flex>
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
