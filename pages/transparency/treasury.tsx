import { Flex, Stack, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { Prices } from '@app/types'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO } from '@app/hooks/useDAO'
import { Funds, getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { RTOKEN_SYMBOL } from '@app/variables/tokens'

const FundsDetails = ({ funds, title, prices }: { funds: any, title: string, prices: Prices["prices"] }) => {
  return <Stack p={'1'} direction="column" minW={{ base: 'full', sm: '400px' }} >
    <Stack>
      <Text color="secondary" fontSize="20px" fontWeight="extrabold">{title}:</Text>
      {
        funds?.length && <Funds prices={prices} funds={funds} chartMode={true} showTotal={true} />
      }
    </Stack>
    <Stack fontSize="12px">
      <Funds prices={prices} funds={funds} showPrice={false} showTotal={false} />
    </Stack>
  </Stack>
}

export const Overview = () => {
  const { prices } = usePricesV2(true)
  const { treasury, anchorReserves, bonds, multisigs } = useDAO();

  const TWGfunds = multisigs?.find(m => m.shortName === 'TWG')?.funds||[];
  const TWGFtmfunds = multisigs?.find(m => m.shortName === 'TWG on FTM')?.funds||[];

  const totalHoldings = [
    { token: { symbol: 'Treasury Contract', address: '1' }, balance: getFundsTotalUsd(treasury, prices), usdPrice: 1 },
    { token: { symbol: 'Anchor Reserves', address: '2' }, balance: getFundsTotalUsd(anchorReserves, prices), usdPrice: 1 },
    { token: { symbol: 'Bonds Manager Contract', address: '3' }, balance: getFundsTotalUsd(bonds.balances, prices), usdPrice: 1 },
    { token: { symbol: 'Multisigs', address: '4' }, balance: getFundsTotalUsd(TWGfunds.concat(TWGFtmfunds), prices), usdPrice: 1 },
  ];

  const totalMultisigs = multisigs?.map(m => {
    return { token: { symbol: m.name, address: m.address }, balance: getFundsTotalUsd(m.funds, prices, 'both'), usdPrice: 1 }
  });

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Overview</title>
      </Head>
      <AppNav active="Transparency" activeSubmenu="Overview" />
      <TransparencyTabs active="overview" />
      <Flex w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2" px="5" maxWidth="1200px" w='full'>
          <Stack spacing="5" direction={{ base: 'column', lg: 'column' }} w="full" justify="space-around">
          <Stack w='full' justifyContent="space-evenly" spacing="5" direction={{ base: 'column', lg: 'row' }}>
              <FundsDetails title="Total Treasury Holdings" funds={totalHoldings} prices={prices} />
              <FundsDetails title="Multisigs's Holdings & Allowances" funds={totalMultisigs} prices={prices} />
            </Stack>
            <Stack w='full' justifyContent="space-evenly" spacing="5" direction={{ base: 'column', lg: 'row' }}>
              <FundsDetails title="In Treasury Contract" funds={treasury} prices={prices} />
              <FundsDetails title="In Anchor Reserves" funds={anchorReserves} prices={prices} />
            </Stack>
            <Stack w='full' justifyContent="space-evenly" spacing="5" direction={{ base: 'column', lg: 'row' }}>
              <FundsDetails title="TWG on Ethereum" funds={TWGfunds} prices={prices} />
              <FundsDetails title="TWG on Fantom" funds={TWGFtmfunds} prices={prices} />
            </Stack>
            <Stack w='full' justifyContent="space-evenly" spacing="5" direction={{ base: 'column', lg: 'row' }}>
              <FundsDetails title="Reserved For Bonds" funds={bonds?.balances.filter(({ token }) => token.symbol === RTOKEN_SYMBOL)} prices={prices} />
              <FundsDetails title="Received via Bonds" funds={bonds?.balances.filter(({ token }) => token.symbol !== RTOKEN_SYMBOL)} prices={prices} />
            </Stack>
          </Stack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Overview
