import { Flex, Stack, Text, Image } from '@chakra-ui/react'

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
import { InfoMessage } from '@app/components/common/Messages'
import { TransparencyFrontierTabs, TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useRepayments } from '@app/hooks/useRepayments'
import Table from '@app/components/common/Table'
import { preciseCommify } from '@app/util/misc'

const ColHeader = ({ ...props }) => {
  return <Flex justify="flex-start" minWidth={'150px'} fontSize="12px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
  return <Stack cursor="default" direction="row" fontSize="12px" fontWeight="normal" justify="flex-start" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
  return <Text fontSize="12px" {...props} />
}

const ClickableCellText = ({ ...props }) => {
  return <CellText
    textDecoration="underline"
    cursor="pointer"
    style={{ 'text-decoration-skip-ink': 'none' }}
    {...props}
  />
}


const columns = [
  {
    field: 'symbol',
    label: 'Pool',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
    value: ({ symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText>{symbol}</CellText>
      </Cell>
    },
  },
  {
    field: 'badDebtBalance',
    label: 'badDebtBalance',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
    value: ({ badDebtBalance }) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText>{preciseCommify(badDebtBalance, 2)}</CellText>
      </Cell>
    },
  },
  {
    field: 'sold',
    label: 'sold',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
    value: ({ sold }) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText>{preciseCommify(sold, 2)}</CellText>
      </Cell>
    },
  },
  {
    field: 'soldFor',
    label: 'soldFor',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
    value: ({ soldFor }) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText>{preciseCommify(soldFor, 2)}</CellText>
      </Cell>
    },
  },
  {
    field: 'converted',
    label: 'converted',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
    value: ({ converted }) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText>{preciseCommify(converted, 2)}</CellText>
      </Cell>
    },
  },
];

export const ShortfallsPage = () => {
  const { data } = useRepayments();
  console.log(data);
  const items = Object.values(data?.badDebts || {}).map(item => {
    return item;
  });
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Shortfalls</title>
        <meta name="og:title" content="Inverse Finance - Shortfalls" />
        <meta name="og:description" content="Frontier's shortfalls" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Shortfalls Details" />
        <meta name="keywords" content="Inverse Finance, transparency, frontier, shortfalls" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Frontier (deprecated)" hideAnnouncement={true} />
      <TransparencyFrontierTabs active="frontier-shortfalls" />
      <ErrorBoundary>
        <Flex w="full" maxW='6xl' direction="column" justify="center">
          <Container
            noPadding
            label={`Bad debt and repayment details`}
          >
            <Table
              items={items}
              columns={columns}
              key="symbol"
            />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default ShortfallsPage
