import { Flex, Stack } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePositions } from '@app/hooks/usePositions'
import { useState } from 'react'
import { PositionsTable } from '@app/components/Positions/PositionsTable'
import moment from 'moment'
import { TopDelegatesAutocomplete } from '@app/components/common/Input/TopDelegatesAutocomplete'
import { shortenAddress } from '@app/util'

export const PositionsPage = () => {
  const [accounts, setAccounts] = useState('');
  const { positions, markets, prices, collateralFactors, lastUpdate } = usePositions({ accounts });

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Positions</title>
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
            label={`${accounts ? shortenAddress(accounts)+"'s Positions" : 'Shortfalling Positions'} - ${!lastUpdate ? 'Loading...' : 'Last update '+moment(lastUpdate).fromNow()}`}
          >
            <PositionsTable collateralFactors={collateralFactors} markets={markets} prices={prices} positions={positions} />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default PositionsPage
