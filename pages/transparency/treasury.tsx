import { Flex, FormControl, FormLabel, SimpleGrid, Stack, Switch, Text, Checkbox } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO } from '@app/hooks/useDAO'
import { getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { getNetworkImage } from '@app/util/networks'
import { useState } from 'react'
import { NetworkIds } from '@app/types'

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

export const Overview = () => {
  const { prices, isLoading: isLoadingPrices } = usePricesV2(true)
  const { treasury, anchorReserves, multisigs, isLoading: isLoadingDao } = useDAO();
  const [excludeOwnTokens, setExcludeOwnTokens] = useState(false);
  const [excludeOwnTokens2, setExcludeOwnTokens2] = useState(false);

  const TWGmultisigs = multisigs?.filter(m => m.shortName.includes('TWG') && m.chainId !== NetworkIds.ftm) || [];
  const TWGfunds = TWGmultisigs.map(m => m.funds);

  const totalMultisigs = multisigs?.map(m => {
    return { label: m.shortName, balance: getFundsTotalUsd(m.funds.filter(above100UsdFilter), prices, 'balance'),  onlyUsdValue: true, usdPrice: 1, drill: m.funds }
  });

  const totalHoldings = [
    { label: 'Treasury Contract', balance: getFundsTotalUsd(treasury, prices, 'balance'), onlyUsdValue: true, usdPrice: 1, drill: treasury },
    { label: 'Frontier Reserves', balance: getFundsTotalUsd(anchorReserves, prices, 'balance'),  onlyUsdValue: true, usdPrice: 1, drill: anchorReserves },
    { label: 'veNFTs', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !!fund.token.veNftId)), prices, 'balance'),  onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
    { label: 'Multisigs (excl. veNFTs)', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !fund.token.veNftId)), prices, 'balance'),  onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
  ];

  const totalHoldingsExcludeOwnTokens = [
    { label: 'Treasury Contract', balance: getFundsTotalUsd(treasury.filter(t => !OWN_TOKENS.includes(t.token.symbol)), prices, 'balance'),  onlyUsdValue: true, usdPrice: 1, drill: treasury },
    { label: 'Frontier Reserves', balance: getFundsTotalUsd(anchorReserves, prices, 'balance'), usdPrice: 1, drill: anchorReserves },
    { label: 'veNFTs', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !!fund.token.veNftId)), prices, 'balance'),  onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
    { label: 'Multisigs (excl. veNFTs)', balance: getFundsTotalUsd(multisigs?.map(m => m.funds.filter(fund => !fund.token.veNftId).filter(t => !OWN_TOKENS.includes(t.token.symbol))), prices, 'balance'),  onlyUsdValue: true, usdPrice: 1, drill: totalMultisigs },
  ];

  const treasuryHoldings = excludeOwnTokens2 ? treasury.filter(t => !OWN_TOKENS.includes(t.token.symbol)) : treasury;

  const isLoading = isLoadingDao || isLoadingPrices;
  const mainFontSize = { base: '16px', sm: '20px', md: '26px' };
  const dashboardCardTitleProps = { w: 'fit-content', position: 'static', fontSize: mainFontSize, fontWeight: 'extrabold' };
  const dashboardCardProps = { direction: 'column', mx: '0', w: { base: '100vw', sm: '95vw', lg: '600px' }, borderRadius: { base: '0', sm: '8' } };

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
            <SimpleGrid columns={{ base: 1, xl: 2 }} spacingX="50px" spacingY="40px">
              <DashBoardCard cardTitle="Total Treasury Holdings" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <ExcludeOwnTokens label="Exclude Treasury INV & DBR" setter={setExcludeOwnTokens} value={excludeOwnTokens} id='exclude-1' />
                <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={excludeOwnTokens ? totalHoldingsExcludeOwnTokens : totalHoldings} prices={prices} type='balance' useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard cardTitle="Multisigs's Holdings" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
                <FundsDetails leftSideMaxW='300px' w='full' isLoading={isLoading} funds={totalMultisigs} prices={prices} type='balance' useRecharts={true} />
              </DashBoardCard>
              <DashBoardCard cardTitle="In Treasury Contract" cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
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
                  return <DashBoardCard imageSrc={getNetworkImage(TWGmultisigs[i].chainId)} cardTitle={TWGmultisigs[i].shortName === 'TWG' ? 'TWG on Mainnet' : TWGmultisigs[i].shortName} cardTitleProps={dashboardCardTitleProps} {...dashboardCardProps}>
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
