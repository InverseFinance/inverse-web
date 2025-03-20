import { Flex, Stack } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useState } from 'react'
import { PositionsTable } from '@app/components/Positions/PositionsTable'
 
import { TopDelegatesAutocomplete } from '@app/components/common/Input/TopDelegatesAutocomplete'
import { shortenAddress } from '@app/util'
import { timeSince } from '@app/util/time'
const snapshot = require('public/p.json');

export const PositionsSnapshotPage = () => {
  const [accounts, setAccounts] = useState('');
  const { positions, markets, prices, collateralFactors, lastUpdate } = snapshot;

  const filtered = accounts ? positions.filter(p => p.account.toLowerCase() === accounts.toLowerCase()) : positions;

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Positions Snapshot</title>
      </Head>
      <AppNav active="Positions" />
      <ErrorBoundary>
        <Flex w="full" maxW='6xl' direction="column" justify="center">
          <Container
            label={`Filter by account (Shortfalling or Not)`}
          >
            <Stack minW={{ base: 'full', sm: '450px' }} w='full'>
              <TopDelegatesAutocomplete onItemSelect={(item) => item?.value ? setAccounts(item?.value) : setAccounts('') } />
            </Stack>
          </Container>
          <Container
            label={`${accounts ? shortenAddress(accounts)+"'s Positions" : 'Positions'} - ${!lastUpdate ? 'Loading...' : 'Snapshot taken '+timeSince(lastUpdate)}`}
          >
            <PositionsTable defaultSort="usdSupplied" collateralFactors={collateralFactors} markets={markets} prices={prices} positions={filtered} />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default PositionsSnapshotPage
