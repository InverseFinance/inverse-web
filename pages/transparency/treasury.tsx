import { Flex, SimpleGrid, Stack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useCompensations, useDAO } from '@app/hooks/useDAO'
import { getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { PayrollDetails } from '@app/components/Transparency/PayrollDetails'
import { DashBoardCard } from '@app/components/F2/UserDashboard'

export const Overview = () => {
  const { prices, isLoading: isLoadingPrices } = usePricesV2(true)
  const { treasury, anchorReserves, multisigs, isLoading: isLoadingDao } = useDAO();
  const { currentPayrolls } = useCompensations();

  const TWGmultisigs = multisigs?.filter(m => m.shortName.includes('TWG')) || [];
  const TWGfunds = TWGmultisigs.map(m => m.funds);

  const totalMultisigs = multisigs?.map(m => {
    return { label: m.shortName, balance: getFundsTotalUsd(m.funds, prices, 'balance'), usdPrice: 1, drill: m.funds }
  });

  const totalHoldings = [
    { label: 'Treasury Contract', balance: getFundsTotalUsd(treasury, prices, 'balance'), usdPrice: 1, drill: treasury },
    { label: 'Frontier Reserves', balance: getFundsTotalUsd(anchorReserves, prices, 'balance'), usdPrice: 1, drill: anchorReserves },
    // { label: 'Bonds Manager Contract', balance: getFundsTotalUsd(bonds.balances, prices), usdPrice: 1, drill: bonds.balances },
    { label: 'Multisigs (includes veNFTs)', balance: getFundsTotalUsd(multisigs?.map(m => m.funds), prices, 'balance'), usdPrice: 1, drill: totalMultisigs },
  ];

  const isLoading = isLoadingDao || isLoadingPrices;
  const dashboardCardTitleProps = { w: 'fit-content', position: 'static' };
  const dashboardCardProps = {  direction: 'column' };

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
        <Flex direction="column" py="4" px="5" maxWidth="1200px" w='full'>
          <Stack spacing="5" direction={{ base: 'column', lg: 'column' }} w="full" justify="space-around">
            <SimpleGrid minChildWidth={{ base: '300px', sm: '400px' }} spacingX="50px" spacingY="40px">
              <DashBoardCard cardTitle="Total Treasury Holdings" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <FundsDetails w='full' isLoading={isLoading} funds={totalHoldings} prices={prices} type='balance' useRecharts={false} />
              </DashBoardCard>
              <DashBoardCard cardTitle="Multisigs's Holdings" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <FundsDetails w='full' isLoading={isLoading} funds={totalMultisigs} prices={prices} type='balance' useRecharts={false} />
              </DashBoardCard>
              <DashBoardCard cardTitle="In Treasury Contract" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <FundsDetails w='full' isLoading={isLoading} funds={treasury} prices={prices} type='balance' useRecharts={false} />
              </DashBoardCard>
              <DashBoardCard cardTitle="In Frontier Reserves" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <FundsDetails w='full' isLoading={isLoading} funds={anchorReserves} prices={prices} type='balance' useRecharts={false} />
              </DashBoardCard>
              <DashBoardCard cardTitle="DOLA Monthly Payrolls" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <PayrollDetails w='full' isLoading={isLoading} currentPayrolls={currentPayrolls} prices={prices}  useRecharts={false}  />
              </DashBoardCard>
              <DashBoardCard cardTitle="Unclaimed Payrolls" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <PayrollDetails w='full' isLoading={isLoading} currentPayrolls={currentPayrolls} prices={prices} fundKey={'unclaimed'} toMonthly={false}  useRecharts={false}  />
              </DashBoardCard>
              {/* <FundsDetails title="Reserved For Bonds" funds={bonds?.balances.filter(({ token }) => token.symbol === RTOKEN_SYMBOL)} prices={prices} /> */}
              {/* <FundsDetails title="Kept in the Bonds Manager" funds={bonds?.balances.filter(({ token }) => token.symbol !== RTOKEN_SYMBOL)} prices={prices} /> */}
              {
                TWGfunds.map((mf, i) => {
                  return <DashBoardCard cardTitle={TWGmultisigs[i].name} cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                    <FundsDetails w='full' isLoading={isLoading} funds={mf} prices={prices} type='balance' useRecharts={false} />
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
