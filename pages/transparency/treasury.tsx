import { Flex, Stack, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { Prices } from '@app/types'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useDAO } from '@app/hooks/useDAO'
import { Funds } from '@app/components/Transparency/Funds'
import { RTOKEN_SYMBOL } from '@app/variables/tokens'

const FundsDetails = ({ funds, title, prices }: { funds: any, title: string, prices: Prices["prices"] }) => {
  return <Stack p={'1'} direction="column" minW={{ base: 'full', sm: '350px' }} >
    <Stack>
      <Text fontWeight="bold">{title}:</Text>
      {
        funds?.length && <Funds prices={prices} funds={funds} chartMode={true} showTotal={true} />
      }
    </Stack>
    <Stack>
      <Funds prices={prices} funds={funds} showPrice={false} showTotal={false} />
    </Stack>
  </Stack>
}

export const Overview = () => {
  const { prices } = usePricesV2(true)
  const { treasury, anchorReserves, bonds } = useDAO();

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
              <FundsDetails title="In Treasury Contract" funds={treasury} prices={prices} />
              <FundsDetails title="In Anchor Reserves" funds={anchorReserves} prices={prices} />
            </Stack>
            <Stack w='full' justifyContent="space-evenly" spacing="5" direction={{ base: 'column', lg: 'row' }}>
              <FundsDetails title="Reserved For Bods" funds={bonds?.balances.filter(({ token }) => token.symbol === RTOKEN_SYMBOL)} prices={prices} />
              <FundsDetails title="Received via Bonds" funds={bonds?.balances.filter(({ token }) => token.symbol !== RTOKEN_SYMBOL)} prices={prices} />
            </Stack>
          </Stack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Overview
