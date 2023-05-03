import { Flex, Stack, Text, Image } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyFrontierTabs, TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useRepayments } from '@app/hooks/useRepayments'
import Table from '@app/components/common/Table'
import { preciseCommify } from '@app/util/misc'
import { UnderlyingItem } from '@app/components/common/Assets/UnderlyingItem'
import { usePrices } from '@app/hooks/usePrices'

const ColHeader = ({ ...props }) => {
  return <Flex justify="center" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
  return <Stack cursor="default" direction="row" fontSize="14px" fontWeight="normal" justify="center" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
  return <Text fontSize="14px" {...props} />
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
    label: 'Asset',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-start"  {...props} />,
    value: (token) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <UnderlyingItem {...token} badge={undefined} label={token.symbol} />
      </Cell>
    },
  },
  {
    field: 'badDebtUsd',
    label: 'Bad Debt',
    boxProps: { color: 'warning' },
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ badDebtBalance, badDebtUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText fontWeight="bold" >{preciseCommify(badDebtUsd, 0, true)}</CellText>
        <CellText >{preciseCommify(badDebtBalance, symbol === 'DOLA' ? 0 : 2)} {symbol}</CellText>        
      </Cell>
    },
  },
  {
    field: 'sold',
    label: 'Repayer: Debt sold',
    
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center" {...props} />,
    value: ({ sold, priceUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!sold && <CellText fontWeight="bold" >{preciseCommify(sold * priceUsd, 0, true)}</CellText>}
        <CellText >{sold ? `${preciseCommify(sold, 2)} ${symbol}` : '-'}</CellText>        
      </Cell>
    },
  },
  {
    field: 'soldFor',
    label: 'Repayer: Paid by Treasury',
    
    header: ({ ...props }) => <ColHeader  minWidth="150px" justify="center"  {...props} />,
    value: ({ soldFor, priceUsd, symbol }) => {
      return <Cell  minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!soldFor && <CellText fontWeight="bold" >{preciseCommify(soldFor * priceUsd, 0, true)}</CellText>}
        <CellText >{soldFor ? `${preciseCommify(soldFor, 2)} ${symbol}` : '-'}</CellText>        
      </Cell>
    },
  },
  {
    field: 'converted',
    label: 'Converter: sold for IOUs',
    
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ converted, priceUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!converted && <CellText  fontWeight="bold">{preciseCommify(converted * priceUsd, 0, true)}</CellText>}
        <CellText >{converted ? `${preciseCommify(converted, 2)} ${symbol}` : '-'}</CellText>        
      </Cell>
    },
  },  
  {
    field: 'repaidViaDwf',
    label: 'Repayment via DWF deal',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ repaidViaDwf }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText>{repaidViaDwf ? `${preciseCommify(repaidViaDwf, 0)} USDC` : '-'}</CellText>
      </Cell>
    },
  },
];

export const ShortfallsPage = () => {
  const { data } = useRepayments();  
  const { prices } = usePrices();
  const items = Object.values(data?.badDebts || {}).map(item => {
    const priceUsd = prices[item.coingeckoId]?.usd||1;
    return { ...item, badDebtUsd: item.badDebtBalance * priceUsd, priceUsd };
  }).filter(item => item.badDebtBalance > 0.1);
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
              defaultSort="badDebtUsd"
              defaultSortDir="desc"
            />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default ShortfallsPage
