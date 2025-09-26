import { Flex, FormControl, FormLabel, SimpleGrid, Stack, Switch, Text, Checkbox, HStack, VStack, useMediaQuery } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useCompensations, useDAO, useLiquidityPools, useStableReserves } from '@app/hooks/useDAO'
import { getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { getNetworkConfigConstants, getNetworkImage } from '@app/util/networks'
import { useEffect, useState } from 'react'
import { NetworkIds } from '@app/types'
import { getScanner } from '@app/util/web3'
import FirmLogo from '@app/components/common/Logo/FirmLogo'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { DefaultCharts } from '@app/components/Transparency/DefaultCharts'
import { timestampToUTC } from '@app/util/misc'
import { shortenNumber } from '@app/util/markets'

const OWN_TOKENS = ['DBR', 'INV'];

const { TREASURY } = getNetworkConfigConstants();

const ExcludeOwnTokens = ({
  id,
  setter,
  value,
  label = 'Exclude INV & DBR'
}: {
  id: string,
  setter: (value: boolean) => void,
  value: boolean,
  label?: string
}) => <FormControl zIndex="2" top={{ base: '65px', sm: '70px' }} position="absolute" w='fit-content' display='flex' alignItems='center'>
    <FormLabel cursor="pointer" fontWeight='normal' fontSize='14px' color='secondaryTextColor' htmlFor={id} mb='0'>
      {label}
    </FormLabel>
    <Checkbox onChange={() => setter(!value)} isChecked={value} id={id} />
  </FormControl>

const above100UsdFilter = (item) => item.balance * (item.price || item.usdPrice) >= 100;

const maxChartWidth = 1350;

export const Overview = () => {
  const { themeName } = useAppTheme();
  const { prices, isLoading: isLoadingPrices } = usePricesV2(true)
  const { treasury, anchorReserves, multisigs, isLoading: isLoadingDao } = useDAO();
  // const { liquidity, isLoading: isLoadingLiquidity } = useLiquidityPools();
  const { stableReservesEvolution, isLoading: isLoadingStableReserves } = useStableReserves();
  const { currentPayrolls } = useCompensations();
  const [excludeOwnTokens, setExcludeOwnTokens] = useState(false);
  const [excludeOwnTokens2, setExcludeOwnTokens2] = useState(false);
  const [now, setNow] = useState(Date.now());

  const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
  const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

  const TWGmultisigs = multisigs?.filter(m => m.shortName.includes('TWG') && m.chainId !== NetworkIds.ftm) || [];
  const TWGfunds = TWGmultisigs.map(m => m.funds);

  // stable reserves
  const treasuryStables = treasury?.filter(f => (f.token.isStable) || (['DOLA', 'USDC', 'USDT', 'sDOLA', 'DAI', 'USDS'].includes(f.token.symbol))).map(f => {
    return { ...f, label: `${f.token.symbol} (Treasury)`, balance: f.balance, onlyUsdValue: true, usdPrice: (f.price || prices[f.token.symbol]?.usd || prices[f.token.coingeckoId]?.usd || 1) }
  }) || [];

  const twgStables = TWGmultisigs.map(m => {
    return m.funds.filter(f => (f.token.isStable) || (['DOLA', 'USDC', 'USDT', 'sDOLA', 'DAI', 'USDS', 'sinvUSD'].includes(f.token.symbol))).map(f => {
      return { ...f, label: `${f.token.symbol.replace(/ [a-z]*lp$/ig, '')} (${m.shortName})`, balance: f.balance, onlyUsdValue: true, usdPrice: (f.price || prices[f.token.symbol]?.usd || prices[f.token.coingeckoId]?.usd || 1) }
    });
  }).flat();

  // const twgStableLps = liquidity.filter(m => m.isStable && !m.isFed).map(m => {
  //   const twg = TWGmultisigs.find(m => m.chainId === m.chainId);
  //   // ownedAmount already in usd
  //   return { label: `${m.lpName} (${twg?.shortName || 'TWG'})`, balance: m.owned?.twg||0, onlyUsdValue: true, usdPrice: 1 }
  // });

  const dolaFrontierReserves = anchorReserves.filter(f => f.token.symbol === 'DOLA')
    .map(f => {
      return { ...f, label: 'DOLA (Frontier Reserves)', balance: f.balance, onlyUsdValue: true, usdPrice: 1 }
    });

  const stableReserves = [
    ...treasuryStables, 
    ...twgStables,
    ...dolaFrontierReserves,
    // , ...twgStableLps
  ];
  const totalCurrentStableReserves = stableReserves.reduce((prev, curr) => prev + curr.balance * curr.usdPrice, 0);

  // runway
  const totalCurrentPayrolls = currentPayrolls.reduce((prev, curr) => prev + curr.amount, 0);
  const runwayInYears = totalCurrentPayrolls ? totalCurrentStableReserves / totalCurrentPayrolls : 0;
  const runwayInMonths = runwayInYears * 12;

  const stableAndRunwayEvolution = stableReservesEvolution.map(d => {
    return { ...d, runway: totalCurrentPayrolls ? d.y / totalCurrentPayrolls * 12 : 0 };
  });

  // if (totalCurrentStableReserves) {
  //   stableAndRunwayEvolution.push({ x: now, timestamp: now, y: totalCurrentStableReserves, runway: runwayInMonths, totalReserves: totalCurrentStableReserves, utcDate: timestampToUTC(now) });
  // }

  useEffect(() => {
    setAutoChartWidth(isLargerThan ? maxChartWidth : (window.innerWidth))
  }, [isLargerThan]);

  const totalMultisigs = multisigs?.map(m => {
    return { label: m.shortName, balance: getFundsTotalUsd(m.funds.filter(above100UsdFilter), prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: m.funds }
  });

  const totalHoldings = [
    { label: 'Treasury Contract', balance: getFundsTotalUsd(treasury, prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: treasury },
    { label: 'Frontier Reserves', balance: getFundsTotalUsd(anchorReserves, prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: anchorReserves },
    { label: 'veNFTs', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !!fund.token.veNftId)), prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
    { label: 'Multisigs (excl. veNFTs)', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !fund.token.veNftId)), prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
  ];

  const totalHoldingsExcludeOwnTokens = [
    { label: 'Treasury Contract', balance: getFundsTotalUsd(treasury.filter(t => !OWN_TOKENS.includes(t.token.symbol)), prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: treasury },
    { label: 'Frontier Reserves', balance: getFundsTotalUsd(anchorReserves, prices, 'balance'), usdPrice: 1, drill: anchorReserves },
    { label: 'veNFTs', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !!fund.token.veNftId)), prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
    { label: 'Multisigs (excl. veNFTs)', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !fund.token.veNftId).filter(t => !OWN_TOKENS.includes(t.token.symbol))), prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
  ];

  const treasuryHoldings = excludeOwnTokens2 ? treasury.filter(t => !OWN_TOKENS.includes(t.token.symbol)) : treasury;

  const isLoading = isLoadingDao || isLoadingPrices;
  const mainFontSize = { base: '16px', sm: '20px', md: '26px' };
  const dashboardCardTitleProps = { w: 'fit-content', position: 'static', fontSize: mainFontSize, fontWeight: 'extrabold' };
  const dashboardCardProps = { direction: 'column', mx: '0', w: { base: '100vw', sm: '95vw', lg: '600px' }, borderRadius: { base: '0', sm: '8' } };
  const defillamaTextProps = { ...dashboardCardTitleProps, fontSize: '26px', mt: '1' };

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Treasury</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Treasury Details" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Treasury Details" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, treasury, funds, liquidity, pol, holdings" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Treasury" hideAnnouncement={true} />
      <TransparencyTabs active="treasury" />
      <Flex w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="4" px={{ base: '0', sm: '5' }} maxWidth="1400px" w='full'>
          <Stack spacing="5" direction="column" w="full" justify="space-around" alignItems={'center'}>
            <DashBoardCard cardTitle={
              <HStack alignItems="center" position={{ base: 'static', md: 'absolute' }} left="0" top="0" w="full" justifyContent="center">
                <Text {...defillamaTextProps}>Treasury Evolution</Text>
              </HStack>
            }
              {...dashboardCardProps} w='full' p="0">
              <iframe width="100%" height="360px" src={`https://defillama.com/chart/protocol/inverse-finance?treasury=true&tvl=false&events=false&groupBy=daily&theme=${themeName}`} title="DefiLlama" frameborder="0"></iframe>
            </DashBoardCard>
            <VStack w='full' alignItems="center" py="10">
              <DashBoardCard cardTitle="Stable Reserves & Runway" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps} w='full'>
                <DefaultCharts
                  chartData={stableAndRunwayEvolution}
                  maxChartWidth={maxChartWidth}
                  chartWidth={autoChartWidth}
                  isDollars={true}
                  showMonthlyBarChart={false}
                  showAreaChart={true}
                  smoothLineByDefault={true}
                  areaProps={{
                    title: `Currently: ${shortenNumber(totalCurrentStableReserves, 2, true)} and ${runwayInMonths.toFixed(2)} months`,
                    id: 'stable-reserves',
                    showRangeBtns: false,
                    yLabel: 'Stable Reserves',
                    useRecharts: true,
                    allowZoom: true,
                    allowEscapeViewBox: false,
                    showSecondary: true,
                    secondaryRef: 'runway',
                    secondaryLabel: 'Runway in months',
                    secondaryAsUsd: false,
                    secondaryPrecision: 2,
                  }}
                />
              </DashBoardCard>
            </VStack>
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacingX="50px" spacingY="40px">
              <DashBoardCard cardTitle="Total Treasury Holdings" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <ExcludeOwnTokens label="Exclude Treasury INV & DBR" setter={setExcludeOwnTokens} value={excludeOwnTokens} id='exclude-1' />
                <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={excludeOwnTokens ? totalHoldingsExcludeOwnTokens : totalHoldings} prices={prices} type='balance' useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard cardTitle="Total Stable Reserves" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <VStack zIndex="2" top={{ base: '65px', sm: '70px' }} position="absolute" w='fit-content' display='flex' alignItems='center'>
                  <Text mb='0' fontWeight='normal' fontSize='14px' color='secondaryTextColor'>
                    Current runway: {runwayInMonths ? `${runwayInMonths.toFixed(2)} months` : ''}
                  </Text>
                </VStack>
                <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={stableReserves} prices={prices} type='balance' useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard cardTitle="Multisigs's Holdings" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={totalMultisigs} prices={prices} type='balance' useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard externalLink={`${getScanner(1)}/address/${TREASURY}`} cardTitle="In Treasury Contract" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <ExcludeOwnTokens label="Exclude INV & DBR" setter={setExcludeOwnTokens2} value={excludeOwnTokens2} id='exclude-2' />
                <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={treasuryHoldings} prices={prices} type='balance' useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard cardTitle="In Frontier Reserves" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={anchorReserves} prices={prices} type='balance' useRecharts={true} />
              </DashBoardCard>

              {/* <FundsDetails title="Reserved For Bonds" funds={bonds?.balances.filter(({ token }) => token.symbol === RTOKEN_SYMBOL)} prices={prices} /> */}
              {/* <FundsDetails title="Kept in the Bonds Manager" funds={bonds?.balances.filter(({ token }) => token.symbol !== RTOKEN_SYMBOL)} prices={prices} /> */}
              {
                TWGfunds.map((mf, i) => {
                  return <DashBoardCard externalLink={`${getScanner(TWGmultisigs[i].chainId)}/address/${TWGmultisigs[i].address}`} imageSrc={getNetworkImage(TWGmultisigs[i].chainId)} cardTitle={TWGmultisigs[i].shortName === 'TWG' ? 'TWG on Mainnet' : TWGmultisigs[i].shortName} cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                    <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={mf.filter(above100UsdFilter)} prices={prices} type='balance' useRecharts={true} />
                  </DashBoardCard>
                })
              }
            </SimpleGrid>
          </Stack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Overview
