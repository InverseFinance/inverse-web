import { Flex, Stack } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePositions } from '@app/hooks/usePositions'
import { Input } from '@app/components/common/Input'
import { useState } from 'react'
import { PositionsTable } from '@app/components/Positions/PositionsTable'
import { InfoMessage } from '@app/components/common/Messages'
import moment from 'moment'

export const PositionsPage = () => {
  const [accounts, setAccounts] = useState('');
  const { positions, markets, prices, collateralFactors, lastUpdate } = usePositions({ accounts });

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Anchor</title>
      </Head>
      <AppNav active="Positions" />
      <ErrorBoundary>
        <Flex w="full" direction="column" justify="center">
          {/* <Container
            label={`Filters & Infos`}
          >
            <Stack direction={{ base: 'column', lg: 'row' }} w='full'>
              <Input fontSize="12px" textAlign="left" onChange={(e) => setAccounts(e.target.value)} value={accounts} placeholder="Filter by accounts" />
              <InfoMessage alertProps={{ w:'full' }} description="Note: all calculations are made with Oracle Prices" />
            </Stack>
          </Container> */}
          <Container
            label={`Shortfalling Positions - ${!lastUpdate ? 'Updating...' : 'Last update '+moment(lastUpdate).fromNow()}`}
          >
            <PositionsTable collateralFactors={collateralFactors} markets={markets} prices={prices} positions={positions} />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default PositionsPage
