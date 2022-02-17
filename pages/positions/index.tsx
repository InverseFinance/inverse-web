import { Flex, Stack, Text, Image, HStack } from '@chakra-ui/react'

import { SubmitButton } from '@app/components/common/Button'
import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePositions } from '@app/hooks/usePositions'
import Table from '@app/components/common/Table'
import ScannerLink from '@app/components/common/ScannerLink'
import { shortenNumber } from '@app/util/markets'
import { UNDERLYING } from '@app/variables/tokens'
import { AccountPosition, Token } from '@app/types'

const getColumns = (markets: string[]) => {
  return [
    {
      field: 'account',
      label: 'Account',
      header: ({ ...props }) => <Flex justify="start" {...props} minW="100px"/>,
      value: ({ account, usdShortfall }: AccountPosition) => {
        const color = usdShortfall > 0 ? 'error' : 'secondary'
        return <Stack minW="100px" position="relative" color={color}>
          <ScannerLink value={account} />
        </Stack>
      },
    },
    {
      field: 'assetsIn',
      label: 'Collaterals',
      header: ({ ...props }) => <Flex justify="flex-start" {...props} minW="100px" />,
      value: ({ assetsIn }: AccountPosition) => {
        const assets: Token[] = (assetsIn?.map(adIndex => UNDERLYING[markets[adIndex]]) || []).filter(v => !!v);
        return <HStack minW="100px" justify="flex-start">
          {
            assets?.map(token => <Image width={'20px'} src={token?.image} ignoreFallback={true} />)
          }
        </HStack>
      },
    },
    {
      field: 'borrowed',
      label: 'Borrowed',
      header: ({ ...props }) => <Flex justify="flex-start" {...props} minW="100px" />,
      value: ({ borrowed }: AccountPosition) => {
        const assets: Token[] = (borrowed?.filter(b => b.value > 0).map(b => UNDERLYING[markets[b.marketIndex]]) || []).filter(v => !!v);
        return <HStack minW="100px" justify="flex-start">
          {
            assets?.map(token => <Image width={'20px'} src={token?.image} ignoreFallback={true} />)
          }
        </HStack>
      },
    },
    {
      field: 'usdBorrowed',
      label: 'Borrowed',
      header: ({ ...props }) => <Flex justify="start" {...props} minW="100px"/>,
      value: ({ usdBorrowed }: AccountPosition) => {
        return <Stack minW="100px">
          <Text>{shortenNumber(usdBorrowed, 2, true)}</Text>
        </Stack>
      },
    },
    {
      field: 'usdBorrawable',
      label: 'Borrowable Left',
      header: ({ ...props }) => <Flex justify="start" {...props} minW="100px"/>,
      value: ({ usdBorrowable }: AccountPosition) => {
        const color = usdBorrowable > 0 ? 'secondary' : 'white'
        return <Stack minW="100px" position="relative" color={color}>
          <Text color={color}>{shortenNumber(usdBorrowable, 2, true)}</Text>
        </Stack>
      },
    },
    {
      field: 'usdShortfall',
      label: 'Shortfall',
      header: ({ ...props }) => <Flex justify="start" {...props} minW="100px"/>,
      value: ({ usdShortfall }: AccountPosition) => {
        const color = usdShortfall > 0 ? 'error' : 'white'
        return <Stack minW="100px" position="relative" color={color}>
          <Text color={color}>{shortenNumber(usdShortfall, 2, true)}</Text>
        </Stack>
      },
    },
    {
      field: 'details',
      label: 'Details',
      header: ({ ...props }) => <Flex justify="start" {...props} minW="100px"/>,
      value: ({  }: AccountPosition) => {
        return <Stack minW="100px" position="relative">
          <SubmitButton>Details</SubmitButton>
        </Stack>
      },
    },
  ]
}

export const Anchor = () => {
  const { positions, markets } = usePositions();

  const columns = getColumns(markets)

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Anchor</title>
      </Head>
      <AppNav active="Positions" />
      <ErrorBoundary>
        <Flex w="full" direction="column" justify="center">
          <Container
            label={`Current Positions`}
            // description=""
          >
            <Table
              keyName="account"
              defaultSort="usdShortfall"
              defaultSortDir="desc"
              columns={columns}
              items={positions}
            />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default Anchor
