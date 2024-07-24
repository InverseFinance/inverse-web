import { Flex, FormControl, FormLabel, SimpleGrid, Stack, Checkbox } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useDOLAPrice, usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO, useFedOverview } from '@app/hooks/useDAO'
import { Funds, getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { DashBoardCard, NumberCard } from '@app/components/F2/UserDashboard'
import { useState } from 'react'
import { useFirmUsers } from '@app/hooks/useFirm'
import { groupPositionsBy } from '@app/components/F2/liquidations/firm-positions'
import { useCustomSWR } from '@app/hooks/useCustomSWR'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { DolaBackingLegend, fedsDataToPieChart } from './dola'

const OWN_TOKENS = ['DBR', 'INV'];

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

export const KeymetricsPage = () => {
  const { themeName, themeStyles } = useAppTheme();
  const { prices, isLoading: isLoadingPrices } = usePricesV2(true);
  const { price: dolaPrice, isLoading: isDolaPriceLoading } = useDOLAPrice();
  const { positions, userPositions, isLoading: isLoadingPositions } = useFirmUsers();
  const { treasury, anchorReserves, multisigs, isLoading: isLoadingDao } = useDAO();
  const { fedOverviews, isLoading: isLoadingOverview } = useFedOverview();
  const { data: currentCirculatingSupply } = useCustomSWR(`/api/dola/circulating-supply`);
  const { data: invCirculatingSupply } = useCustomSWR(`/api/inv/circulating-supply`);
  const invMarketCap = prices["inverse-finance"]?.usd * invCirculatingSupply;
  const [excludeOwnTokens, setExcludeOwnTokens] = useState(false);

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

  const pieSize = 300;

  const totalTvl = positions.reduce((prev, curr) => prev + (curr.deposits * curr.market.price), 0);
  const totalDebt = positions.reduce((prev, curr) => prev + curr.debt, 0);
  const nbUsers = userPositions.length;
  const nbBorrowers = userPositions.filter(p => p.debt > 0).length;
  const nbStakers = userPositions.filter(p => p.stakedInv > 0).length;

  const positionsWithDebt = positions.filter(p => p.debt > 0);
  const positionsWithDeposits = positions.filter(p => p.deposits > 0);
  const groupMarketsByDeposits = groupPositionsBy(positionsWithDeposits, 'marketName', 'tvl');
  const groupMarketsByDebt = groupPositionsBy(positionsWithDebt, 'marketName', 'debt');

  const isLoading = isLoadingDao || isLoadingPrices || isDolaPriceLoading || isLoadingPositions;
  const mainFontSize = { base: '16px', sm: '20px', md: '26px' };
  const dashboardCardTitleProps = { w: 'fit-content', position: 'static', fontSize: mainFontSize, fontWeight: 'extrabold' };
  const dashboardCardProps = { direction: 'column', mx: '0', w: { base: '100vw', sm: '95vw', lg: '600px' }, borderRadius: { base: '0', sm: '8' } };

  const fedsPieChartData = fedsDataToPieChart(fedOverviews, themeStyles?.colors);

  const dolaBackingProps = {
    dataKey: "sliceValue",
    nameKey: "sliceName",
    activeFill: 'keep',
    asStable: true,
    type: 'balance',
    useRecharts: true,
    isLoading,
    w: 'full',
    leftSideMaxW: '300px',
    chartProps: { activeFill: 'keep', centralFill: themeStyles.colors.mainTextColor, isUsd: false }    
  };

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Treasury</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Inverse Finance Key Metrics" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Key Metrics" />
        <meta name="keywords" content="Inverse Finance, transparency, key metrics, treasury, market cap, fees, revenues, dola backing, firm, tvl" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Key Metrics" hideAnnouncement={true} />
      <TransparencyTabs active="keymetrics" />
      <Flex w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="4" px={{ base: '0', sm: '5' }} maxWidth="1400px" w='full'>
          <Stack spacing="50px" direction="column" w="full" justify="space-around" alignItems={'center'}>
            <SimpleGrid columns={{ base: 1, md: 3, xl: 5 }} spacingX="50px" spacingY="40px" w='full'>
              <NumberCard isLoading={isLoading} value={totalTvl} label="FiRM TVL" isUsd={true} />
              <NumberCard isLoading={isLoading} value={totalDebt * dolaPrice} label="FiRM Borrows" isUsd={true} />
              <NumberCard isLoading={isLoading} value={nbUsers} label="Nb Users" />
              <NumberCard isLoading={isLoading} value={currentCirculatingSupply * dolaPrice} label="DOLA Circ. Supply" isUsd={true} />
              <NumberCard isLoading={isLoading} value={invMarketCap} label="INV Market Cap." isUsd={true} />
            </SimpleGrid>
            <Stack w='full' direction={{ base: 'column', xl: 'row' }} spacing="50px" justifyContent="space-between">
              <DashBoardCard cardTitle="TVL by Market" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps} w={{ base: '100%', xl: '50%' }}>
                <Funds isLoading={isLoading} labelWithPercInChart={true} skipLineForPerc={true} funds={groupMarketsByDeposits} chartMode={true} showTotal={false} showChartTotal={true} chartProps={{ width: pieSize, height: pieSize }} useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard cardTitle="Total Treasury Holdings" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps} w={{ base: '100%', xl: '50%' }}>
                <ExcludeOwnTokens label="Exclude Treasury INV & DBR" setter={setExcludeOwnTokens} value={excludeOwnTokens} id='exclude-1' />
                <Funds chartMode={true} leftSideMaxW='300px' w='full' isLoading={isLoading} funds={excludeOwnTokens ? totalHoldingsExcludeOwnTokens : totalHoldings} prices={prices} showTotal={false} showChartTotal={true} type='balance' useRecharts={true} chartProps={{ width: pieSize, height: pieSize }} />
              </DashBoardCard>
            </Stack>
            <Stack w='full' direction={{ base: 'column', xl: 'row' }} spacing="50px" justifyContent="space-between">
              <DashBoardCard cardTitle="Borrows by Market" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps} w={{ base: '100%', xl: '50%' }}>
                <Funds isLoading={isLoading} labelWithPercInChart={true} skipLineForPerc={true} funds={groupMarketsByDebt} chartMode={true} showTotal={false} showChartTotal={true} chartProps={{ width: pieSize, height: pieSize }} useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard position="relative" cardTitle='DOLA Backing Sources' cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps} w={{ base: '100%', xl: '50%' }}>
                <Funds
                  {...dolaBackingProps}
                  chartMode={true}
                  showTotal={false}
                  isLoading={isLoadingOverview}
                  funds={fedsPieChartData}
                />
                <DolaBackingLegend bottom="25px" position={{ base: 'static', xl: 'absolute' }} w="98%" />
              </DashBoardCard>
            </Stack>
            <DashBoardCard cardTitle="FiRM Fees & Revenues" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps} w='full'>
              <iframe width="100%" height="360px" src={`https://defillama.com/chart/protocol/inverse-finance-firm?mcap=false&tokenPrice=false&fees=true&revenue=true&events=false&tvl=false&include_pool2_in_tvl=true&include_staking_in_tvl=true&include_govtokens_in_tvl=true&theme=${themeName}`} title="DefiLlama" frameborder="0"></iframe>
            </DashBoardCard>
          </Stack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default KeymetricsPage
