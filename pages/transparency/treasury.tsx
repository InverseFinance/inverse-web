import { Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { Prices } from '@app/types'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO } from '@app/hooks/useDAO'
import { Funds, getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { CHAIN_TOKENS, RTOKEN_SYMBOL } from '@app/variables/tokens'

const FundsDetails = ({ funds, title, prices }: { funds: any, title: string, prices: Prices["prices"] }) => {
  return <Stack p={'1'} direction="column" minW={{ base: 'full', sm: '400px' }}>
    <Stack>
      <Text color="secondary" fontSize="20px" fontWeight="extrabold">{title}:</Text>
      <Stack justify="center" alignItems="center">
        {
          funds?.length && <Funds prices={prices} funds={funds} chartMode={true} showTotal={true} />
        }
      </Stack>
    </Stack>
    <Stack fontSize="12px">
      <Funds prices={prices} funds={funds} showPrice={false} showTotal={false} />
    </Stack>
  </Stack>
}

export const Overview = () => {
  const { prices } = usePricesV2(true)
  const { treasury, anchorReserves, bonds, multisigs, pols } = useDAO();

  const TWGfunds = multisigs?.find(m => m.shortName === 'TWG')?.funds || [];
  const TWGFtmfunds = multisigs?.find(m => m.shortName === 'TWG on FTM')?.funds || [];

  const totalHoldings = [
    { label: 'Treasury Contract', balance: getFundsTotalUsd(treasury, prices), usdPrice: 1 },
    { label: 'Anchor Reserves', balance: getFundsTotalUsd(anchorReserves, prices), usdPrice: 1 },
    { label: 'Bonds Manager Contract', balance: getFundsTotalUsd(bonds.balances, prices), usdPrice: 1 },
    { label: 'Multisigs', balance: getFundsTotalUsd(TWGfunds.concat(TWGFtmfunds), prices), usdPrice: 1 },
  ];

  const polsFunds = pols.map(p => {
    return {
      title: `${CHAIN_TOKENS[p.chainId][p.address]?.symbol} Liquidity`,
      funds: [
        { token: { symbol: CHAIN_TOKENS[p.chainId][p.address]?.symbol }, label: 'Protocol Owned', balance: p.ownedAmount },
        { token: { symbol: CHAIN_TOKENS[p.chainId][p.address]?.symbol }, label: 'Not Protocol Owned', balance: p.totalSupply - p.ownedAmount },
      ],
    }
  })

  const totalMultisigs = multisigs?.map(m => {
    return { token: { symbol: m.name, address: m.address }, balance: getFundsTotalUsd(m.funds, prices, 'both'), usdPrice: 1 }
  });

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Treasury</title>
      </Head>
      <AppNav active="Transparency" activeSubmenu="Treasury" />
      <TransparencyTabs active="treasury" />
      <Flex w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2" px="5" maxWidth="1200px" w='full'>
          <Stack spacing="5" direction={{ base: 'column', lg: 'column' }} w="full" justify="space-around">
            <SimpleGrid minChildWidth={{ base: '300px', sm: '400px' }} spacingX="100px" spacingY="40px">
              <FundsDetails title="Total Treasury Holdings" funds={totalHoldings} prices={prices} />
              <FundsDetails title="Multisigs's Holdings & Allowances from Treasury" funds={totalMultisigs} prices={prices} />
              <FundsDetails title="In Treasury Contract" funds={treasury} prices={prices} />
              <FundsDetails title="In Anchor Reserves" funds={anchorReserves} prices={prices} />
              <FundsDetails title="Reserved For Bonds" funds={bonds?.balances.filter(({ token }) => token.symbol === RTOKEN_SYMBOL)} prices={prices} />
              <FundsDetails title="Kept in the Bonds Manager" funds={bonds?.balances.filter(({ token }) => token.symbol !== RTOKEN_SYMBOL)} prices={prices} />
              <FundsDetails title="TWG on Ethereum" funds={TWGfunds} prices={prices} />
              <FundsDetails title="TWG on Fantom" funds={TWGFtmfunds} prices={prices} />              
              {
                polsFunds.map(p => {
                  return <FundsDetails title={p.title} funds={p.funds} prices={prices} />
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
