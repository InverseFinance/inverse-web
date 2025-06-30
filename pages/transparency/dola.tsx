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
import { useRepayments } from '@app/hooks/useRepayments'
import { shortenNumber } from '@app/util/markets'
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader'
import { DolaVolumes } from '@app/components/Transparency/DolaVolumes'

const LEGEND_ITEMS = [
  {
    color: lightTheme.colors.info,
    label: 'LP on a AMM',
  },
  {
    color: lightTheme.colors.success,
    label: 'Collateral on FiRM',
  },
  {
    color: lightTheme.colors.error,
    label: 'Unbacked or mostly unhealthy',
  },
];

export const DolaBackingLegend = (props) => {
  return <Stack direction={{ base: 'column', xl: 'row' }} w='full' justify="space-around" {...props}>
    {
      LEGEND_ITEMS.map((item, index) => {
        return <HStack spacing="2" key={item.color}>
          <Text
            minW="1px"
            h="20px"
            borderColor={item.color}
            // borderStyle={EVENT_DASHES[eventType] ? 'dashed' : undefined}
            borderWidth={'9px'}></Text>
          <Text>{item.label}</Text>
        </HStack>
      })
    }
  </Stack>
}

export const fedsDataToPieChart = (fedOverviews: any[], colors) => {
  return fedOverviews.map(f => {
    const name = f.type === 'AMM' ?
      `${f.name} ` + (f.subBalances.reduce((acc, curr) => acc ? acc + '-' + curr.symbol : curr.symbol, '') + ' LP')
      : f.name;
    const balance = ['FiRM', 'Frontier', 'Gearbox'].includes(f.protocol) ? f.borrows : f.supply - (f.idleDolaBalance||0);
    const color = ['Frontier', 'Fuse'].includes(f.protocol) ? colors.error : f.protocol === 'FiRM' ? colors.success : colors.info;
    return {
      ...f,
      token: { image: f.projectImage, symbol: name },
      onlyUsdValue: true,
      usdPrice: 1,
      balance: balance,
      sliceName: name,
      sliceValue: balance,
      chartFillColor: color,
      textColor: color,
    }
  }).filter(d => d.sliceValue > 0);
}

export const DolaDiagram = () => {
  const { themeStyles } = useAppTheme();
  const { dolaSupplies } = useDAO();
  const { markets, isLoading } = useDBRMarkets();
  const { fedOverviews, isLoading: isLoadingOverview } = useFedOverview();
  const { data, isLoading: isLoadingRepayments } = useRepayments();
  const { prices } = usePrices(['velodrome-finance']);

  const fedsPieChartData = fedsDataToPieChart(fedOverviews, themeStyles?.colors);

  const firmPieChartData = markets.map(f => {
    return {
      ...f,
      token: { ...f.underlying, symbol: `FiRM ${f.name}` },
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

  const totalDolaBadDebt = data?.dolaBadDebtEvolution ? data.dolaBadDebtEvolution[data.dolaBadDebtEvolution.length - 1].badDebt : 0;
  const totalCircSupply = fedsPieChartData.reduce((prev, curr) => prev + curr.sliceValue, 0);
  const currentBacking = (totalCircSupply - totalDolaBadDebt) / totalCircSupply * 100;

  const commonProps = {
    dataKey: "sliceValue",
    nameKey: "sliceName",
    activeFill: 'keep',
    totalLabel: "- Total circulating supply:",
    asStable: true,
    type: 'balance',
    useRecharts: true,
    isLoading,
    w: 'full',
    leftSideMaxW: '300px',
    chartProps: { activeFill: 'keep', centralFill: themeStyles.colors.mainTextColor, isUsd: false }
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
      <Flex maxW='1200px' w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2">
        <VStack spacing="8">
          <InfoMessage
            description={
              <VStack alignItems="flex-start">
                <Text>DOLA is a decentralized stablecoin soft-pegged to the US Dollar. It is backed by a diversified set of assets, including liquidity positions on AMMs and isolated collaterals on FiRM. Even though it has some bad debt since April 2022, it is being repaid over time and it has operated at peg thanks to strong peg mechanisms.</Text>
                {/* <HStack spacing="1">
                  <Text>Current backing:</Text>
                  { isLoading || isLoadingRepayments || isLoadingOverview ? <SmallTextLoader pt="2" w='50px' /> : <Text>{shortenNumber(currentBacking, 2)}%</Text> }
                </HStack> */}
                <Stack direction={{ base: 'column', 'xl': 'row' }}>
                  <Link
                    textDecoration="underline"
                    isExternal
                    about="_blank"
                    href={"https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola#dola-usd-peg-management"}>
                    Learn more about peg management
                  </Link>
                  {/* <Link
                    textDecoration="underline"
                    isExternal
                    about="_blank"
                    href={"https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola#dola-usd-peg-management"}>
                    See bad debt repayments
                  </Link> */}
                </Stack>
              </VStack>
            }
          />
          <DolaBackingLegend />
          <Stack direction={{ base: 'column', lg: 'row' }} justify="space-between" w='full'>
            <DashBoardCard cardTitle='DOLA backing sources overview' {...dashboardCardProps}>
              <FundsDetails
                {...commonProps}
                isLoading={isLoading}
                funds={fedsPieChartData}
              />
            </DashBoardCard>
            <DashBoardCard cardTitle='Detailed DOLA backing sources'  {...dashboardCardProps}>
              <FundsDetails
                {...commonProps}
                isLoading={isLoading}
                funds={underlyingPieChartData}
              />
            </DashBoardCard>
          </Stack>
          <FedList prices={prices} feds={fedOverviews.filter(f => !f.hasEnded)} isLoading={isLoadingOverview} />
          <DolaCircSupplyEvolution />
          <DolaVolumes />
          <Stack spacing={4} direction={{ base: 'column', lg: 'row' }} >
            <DolaMoreInfos />
            <VStack spacing='4' minW='250px' w={{ base: '100%', lg: '50%' }} maxW={{ base: 'full', lg: '400px' }}>
              <DolaSupplies supplies={dolaSupplies.filter(chain => chain.supply > 0)} />
              <ShrinkableInfoMessage
                title="⚡&nbsp;&nbsp;Roles & Powers"
                alertProps={{ w:'full' }}
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
