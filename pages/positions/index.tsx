import { Flex } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePositions } from '@app/hooks/usePositions'
import { Input } from '@app/components/common/Input'
import { useState } from 'react'
import { PositionsTable } from '@app/components/Positions/PositionsTable'

export const Anchor = () => {
  const [accounts, setAccounts] = useState('');
  const { positions, markets, prices } = usePositions({ accounts });

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Anchor</title>
      </Head>
      <AppNav active="Positions" />
      <ErrorBoundary>
        <Flex w="full" direction="column" justify="center">
        <Container
            label={`Filters`}
          >
            <Input onChange={(e) => setAccounts(e.target.value)} value={accounts} placeholder="Filter by accounts" />
          </Container>
          <Container
            label={`Current Positions`}
          >
            <PositionsTable markets={markets} positions={positions} />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default Anchor
