import { Flex, HStack, Stack, Text, VStack } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePositions } from '@app/hooks/usePositions'
import { useState } from 'react'
import { PositionsTable, PositionsTableV2 } from '@app/components/Positions/PositionsTable'
import moment from 'moment'
import { TopDelegatesAutocomplete } from '@app/components/common/Input/TopDelegatesAutocomplete'
import { shortenAddress } from '@app/util'
import { InfoMessage } from '@app/components/common/Messages'
import { TransparencyOtherTabs, TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { preciseCommify } from '@app/util/misc'

export const ShortfallsPage = () => {
  const [accounts, setAccounts] = useState('');
  const { positions, markets, prices, liquidPrices, collateralFactors, lastUpdate } = usePositions({ accounts });
  const shortfalls = positions.filter((position) => position.usdShortfall > 0.1);
  const shortfallsLiquid = positions.filter((position) => position.liquidShortfall > 0.1);

  const dolaBadDebtAccountingLiquidity = positions
    .filter((position) => position.dolaBadDebt > 0)
    .reduce((prev, curr) => prev + curr.dolaBadDebt, 0);

  const dolaBadDebtAsPerContract = positions
    .filter((position) => position.usdShortfall > 0)
    .reduce((prev, curr) => prev + curr.dolaBorrowed, 0);

  const totalDolaBorrowed = positions
    .filter((position) => position.dolaBorrowed > 0)
    .reduce((prev, curr) => prev + curr.dolaBorrowed, 0);

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Shortfalls</title>
        <meta name="og:title" content="Inverse Finance - Shortfalls" />
        <meta name="og:description" content="Frontier's shortfalls" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Shortfalls Details" />
        <meta name="keywords" content="Inverse Finance, transparency, frontier, shortfalls" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Frontier & Other" hideAnnouncement={true} />
      <TransparencyOtherTabs active="frontier-shortfalls" />
      <ErrorBoundary>
        <Flex w="full" maxW='1500px' direction="column" justify="center">
          {/* <Container
            noPadding
            label={`Filter by account (Shortfalling or Not)`}
          >
            <Stack minW={{ base: 'full', sm: '450px' }} w='full'>
              <TopDelegatesAutocomplete onItemSelect={(item) => item?.value ? setAccounts(item?.value) : setAccounts('') } />
            </Stack>
          </Container> */}
          <Container
            noPadding
            label={`DOLA bad debt`}
          >
            <VStack alignItems="flex-start">
              {/* <HStack>
                <Text>- Total DOLA borrowed:</Text>
                <Text>{preciseCommify(totalDolaBorrowed, 0)} DOLA</Text>
              </HStack> */}
              <HStack>
                <Text>- As per contracts:</Text>
                <Text>{preciseCommify(dolaBadDebtAsPerContract, 0)} DOLA</Text>
              </HStack>
              <HStack>
                <Text>- Accounting collaterals with no liquidity:</Text>
                <Text>{preciseCommify(dolaBadDebtAccountingLiquidity, 0)} DOLA</Text>
              </HStack>
            </VStack>
          </Container>
          <Container
            label={`${accounts ? shortenAddress(accounts) + "'s Positions" : 'Shortfalling Positions'} - ${!lastUpdate ? 'Loading...' : 'Last update ' + moment(lastUpdate).fromNow()}`}
            description="Only shortfalls above or equal to $0.1 are shown"
            right={<InfoMessage description="Asset icon sizes reflects the usd worth size" />}
          >
            {/* <PositionsTable collateralFactors={collateralFactors} markets={markets} prices={prices} positions={shortfallsLiquid} /> */}
            <PositionsTableV2 collateralFactors={collateralFactors} markets={markets} prices={prices} positions={shortfallsLiquid} />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default ShortfallsPage
