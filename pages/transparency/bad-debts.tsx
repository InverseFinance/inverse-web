import { Flex, Stack, Text, VStack, Select, HStack, Switch } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useRepayments } from '@app/hooks/useRepayments'
import Table from '@app/components/common/Table'
import { getMonthDiff, preciseCommify } from '@app/util/misc'
import { UnderlyingItem } from '@app/components/common/Assets/UnderlyingItem'
import { usePrices } from '@app/hooks/usePrices'
import { useEventsAsChartData } from '@app/hooks/misc'
import { DefaultCharts } from '@app/components/Transparency/DefaultCharts'
import { useState } from 'react'
import moment from 'moment'
import { shortenNumber, smartShortNumber } from '@app/util/markets'
import ScannerLink from '@app/components/common/ScannerLink'
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp'
import { SkeletonBlob } from '@app/components/common/Skeleton'

const ColHeader = ({ ...props }) => {
  return <Flex justify="center" minWidth={'150px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
  return <Stack cursor="default" direction="row" fontSize="14px" fontWeight="normal" justify="center" minWidth="150px" {...props} />
}

const CellText = ({ ...props }) => {
  return <Text fontSize="14px" {...props} />
}

const defaultTotalValue = (field, items) => {
  return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
    <CellText fontWeight="bold">
      {
        smartShortNumber(items.reduce((prev, curr) => prev + (curr[field] || 0), 0), 2, true)
      }
    </CellText>
  </Cell>
}

const transactionsColumns = [
  {
    field: 'symbol',
    label: 'Asset',
    header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
    value: ({ symbol }) => {
      return <Cell minWidth='100px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText>{symbol}</CellText>
      </Cell>
    },
    totalValue: (field, items) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText fontWeight="bold">Total:</CellText>
      </Cell>
    }
  },
  {
    field: 'txHash',
    label: 'tx',
    header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
    value: ({ txHash }) => {
      return <Cell justify="flex-start" minWidth="100px">
        <ScannerLink value={txHash} type="tx" fontSize='12px' />
      </Cell>
    },
    totalValue: (field, items) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText fontWeight="bold"></CellText>
      </Cell>
    }
  },
  {
    field: 'timestamp',
    label: 'Date',
    header: ({ ...props }) => <ColHeader justify="flex-start" minWidth={'100px'} {...props} />,
    value: ({ timestamp }) => <Cell justify="flex-start" minWidth="100px">
      <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
    </Cell>,
    totalValue: (field, items) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText fontWeight="bold"></CellText>
      </Cell>
    }
  },
  {
    field: 'histoPrice',
    label: 'Historical Price',
    // tooltip: 'Price according to coingecko for that day utc',
    header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    value: ({ histoPrice }) => {
      return <Cell minWidth="100px" justify="center">
        <CellText>{preciseCommify(histoPrice, 4, true)}</CellText>
      </Cell>
    },
    totalValue: (field, items) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText fontWeight="bold"></CellText>
      </Cell>
    }
  },
  {
    field: 'worth',
    label: 'Historical Worth',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ amount, worth }) => {
      return <Cell direction="column" minWidth="150px" justify="center">
        <CellText textAlign="center">{preciseCommify(amount, 4)}</CellText>
        <CellText textAlign="center">({preciseCommify(worth, 2, true)})</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
]

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
    totalValue: (field, items) => {
      return <Cell minWidth='150px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText fontWeight="bold">Totals:</CellText>
      </Cell>
    }
  },
  {
    field: 'totalBadDebtUsd',
    label: 'Total amount to repay',
    tooltip: 'Equals to remaining to repay + what was repaid, with current prices',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ totalBadDebtUsd, totalBadDebt, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText fontWeight="bold">{totalBadDebtUsd ? `${preciseCommify(totalBadDebtUsd, 0, true)}` : '-'}</CellText>
        <CellText>{totalBadDebt ? `${preciseCommify(totalBadDebt, symbol === 'DOLA' ? 0 : 2)} ${symbol}` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  {
    field: 'totalBadDebtRepaidByDaoUsd',
    label: 'Repayments made',
    tooltip: 'Direct repayments made by the DAO, with current prices',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ totalBadDebtRepaidByDao, totalBadDebtRepaidByDaoUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText fontWeight="bold">{totalBadDebtRepaidByDao ? `${preciseCommify(totalBadDebtRepaidByDaoUsd, 0, true)}` : '-'}</CellText>
        <CellText>{totalBadDebtRepaidByDao ? `${preciseCommify(totalBadDebtRepaidByDao, symbol === 'DOLA' ? 0 : 2)} ${symbol === 'IOU' ? 'DOLA' : symbol}` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  {
    field: 'badDebtUsd',
    label: 'Remaining to repay',
    tooltip: 'With current prices',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ badDebtBalance, badDebtUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText fontWeight="bold" >{preciseCommify(badDebtUsd, 0, true)}</CellText>
        <CellText >{preciseCommify(badDebtBalance, symbol === 'DOLA' ? 0 : 2)} {symbol}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  {
    field: 'percRepaid',
    label: 'Share repaid',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ percRepaid }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText>{percRepaid ? `${shortenNumber(percRepaid, 2)}%` : '-'}</CellText>
      </Cell>
    },
    totalValue: (field, items) => {
      const totalOfTotalUsd = items.reduce((prev, curr) => prev + curr['totalBadDebtUsd'], 0);
      const totalOfRepaidUsd = items.reduce((prev, curr) => prev + curr['totalBadDebtRepaidByDaoUsd'], 0);
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText fontWeight="bold">
          {shortenNumber(totalOfRepaidUsd / totalOfTotalUsd * 100, 2)}%
        </CellText>
      </Cell>
    }
  },
];

const indirectRepaymentsColumns = [
  {
    field: 'symbol',
    label: 'Asset',
    header: ({ ...props }) => <ColHeader minWidth="100px" justify="flex-start"  {...props} />,
    value: (token) => {
      return <Cell minWidth='100px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <UnderlyingItem {...token} badge={undefined} label={token.symbol} />
      </Cell>
    },
    totalValue: (field, items) => {
      return <Cell minWidth='100px' spacing="2" justify="flex-start" alignItems="center" direction="row">
        <CellText fontWeight="bold">Totals:</CellText>
      </Cell>
    }
  },
  {
    field: 'soldUsd',
    label: 'Repayer: Debt sold',
    tooltip: 'Stuck assets sold by users to the DAO against a discounted underlying',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center" {...props} />,
    value: ({ sold, priceUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!sold && <CellText fontWeight="bold" >{preciseCommify(sold * priceUsd, 0, true)}</CellText>}
        <CellText >{sold ? `${preciseCommify(sold, 2)} ${symbol}` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  {
    field: 'soldForUsd',
    label: 'Repayer: Sold for',
    tooltip: 'Discounted amounts received by users against their stuck assets',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ soldFor, priceUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!soldFor && <CellText fontWeight="bold" >{preciseCommify(soldFor * priceUsd, 0, true)}</CellText>}
        <CellText >{soldFor ? `${preciseCommify(soldFor, 2)} ${symbol}` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  {
    field: 'convertedUsd',
    label: 'IOU: sold for IOUs',
    tooltip: 'Stuck assets converted to DOLA IOUs',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ converted, convertedUsd, priceUsd, symbol }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!converted && <CellText fontWeight="bold">{preciseCommify(converted * priceUsd, 0, true)}</CellText>}
        <CellText >{converted ? `${preciseCommify(converted, 2)} ${symbol}` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  {
    field: 'convertedForUsd',
    label: 'IOU: total emitted',
    tooltip: 'Stuck assets converted to DOLA IOUs',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ convertedFor, convertedForUsd }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!convertedForUsd && <CellText fontWeight="bold">{preciseCommify(convertedForUsd, 0, true)}</CellText>}
        <CellText >{convertedFor ? `${preciseCommify(convertedFor, 2)} IOU` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  {
    field: 'dolaRepaidForIOUUsd',
    label: 'IOU: repaid in DOLA',
    tooltip: 'Stuck assets converted to DOLA IOUs',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ dolaRepaidForIOU, dolaRepaidForIOUUsd }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        {!!dolaRepaidForIOUUsd && <CellText fontWeight="bold">{preciseCommify(dolaRepaidForIOUUsd, 0, true)}</CellText>}
        <CellText >{dolaRepaidForIOU ? `${preciseCommify(dolaRepaidForIOU, 2)} DOLA` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
  // {
  //   field: 'totalBadDebtReduced',
  //   label: 'Total Bad Debt Reduced',
  //   header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
  //   value: ({ totalBadDebtReduced, symbol, priceUsd }) => {
  //     return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
  //       <CellText>{totalBadDebtReduced ? `${preciseCommify(totalBadDebtReduced * priceUsd, 0, true)}` : '-'}</CellText>
  //       <CellText>{totalBadDebtReduced ? `${preciseCommify(totalBadDebtReduced, symbol === 'DOLA' ? 0 : 2)} ${symbol}` : '-'}</CellText>
  //     </Cell>
  //   },
  // },  
  // {
  //   field: 'totalBadDebtRepaidByDao',
  //   label: 'Repaid',
  //   header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
  //   value: ({ totalBadDebtRepaidByDao, symbol, priceUsd }) => {
  //     return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
  //       <CellText fontWeight="bold">{totalBadDebtRepaidByDao ? `${preciseCommify(totalBadDebtRepaidByDao * priceUsd, 0, true)}` : '-'}</CellText>
  //       <CellText>{totalBadDebtRepaidByDao ? `${preciseCommify(totalBadDebtRepaidByDao, symbol === 'DOLA' ? 0 : 2)} ${symbol}` : '-'}</CellText>
  //     </Cell>
  //   },
  // },
  {
    field: 'repaidViaDwf',
    label: 'Indirect DWF repayment',
    tooltip: 'Funds coming from the DWF OTC used to repay DOLA bad debt',
    header: ({ ...props }) => <ColHeader minWidth="150px" justify="center"  {...props} />,
    value: ({ repaidViaDwf }) => {
      return <Cell minWidth='150px' spacing="2" justify="center" alignItems="center" direction="column">
        <CellText>{repaidViaDwf ? `${preciseCommify(repaidViaDwf, 0)} USDC` : '-'}</CellText>
      </Cell>
    },
    totalValue: defaultTotalValue,
  },
];

const keyPrices = {
  'wbtcRepayedByDAO': 'wrapped-bitcoin',
  'ethRepayedByDAO': 'ethereum',
  'yfiRepayedByDAO': 'yearn-finance',
};

const cgIdsSymbols = {
  'wrapped-bitcoin': 'WBTC',
  'ethereum': 'ETH',
  'dola-usd': 'DOLA',
  'yearn-finance': 'YFI',
};

// in case api failed to fetch a specific date, we use the closest previous date
const getClosestPreviousHistoPrice = (histoPrices: { [key: string]: number }, date: string, defaultPrice: number) => {
  const dates = Object.keys(histoPrices);
  const closestDate = dates.reduce((prev, curr) => {
    return curr < date ? curr : prev;
  }, date);
  return histoPrices[closestDate] || defaultPrice;
}

const formatToBarData = (data: any, item: any, index: number, key: string, isDolaCase: boolean, prices: any, useHistorical = true) => {
  const cgId = isDolaCase ? 'dola-usd' : keyPrices[key];

  const histoData = data ?
    data.histoPrices[cgId]
    : {};

  const price = prices[cgId]?.usd;
  const histoPrice = (histoData && histoData[item.date] ?
    histoData[item.date] : isDolaCase ?
      1 : getClosestPreviousHistoPrice(histoData, item.date, price || 1)
  );

  const symbol = cgIdsSymbols[cgId];
  const worth = item.amount * (useHistorical ? histoPrice : price) || 0

  return {
    ...item,
    key: `${item.txHash}-${symbol}-${index}`,
    cgId,
    symbol,
    histoPrice,
    worth,
  };
}

const totalRepaymentKeys = ['wbtcRepayedByDAO', 'ethRepayedByDAO', 'yfiRepayedByDAO', 'totalDolaRepayedByDAO', 'dolaForIOUsRepayedByDAO'];

export const BadDebtPage = () => {
  const { data } = useRepayments();
  const [useUsd, setUseUsd] = useState(true);
  const [useHistorical, setUseHistorical] = useState(false);
  const { prices } = usePrices();
  const [selected, setSelected] = useState('all');
  const isAllCase = selected === 'all';
  const isDolaCase = selected.toLowerCase().includes('dola');

  const dolaPrice = !!prices ? prices['dola-usd']?.usd : 1;

  const totalDirectRepaymentsForTable = totalRepaymentKeys.map(key => {
    return (data[key] || []).map((d, i) => formatToBarData(data, d, i, key, key.toLowerCase().includes('dola'), prices, true));
  }).flat();

  const totalDirectRepaymentsForChart = totalRepaymentKeys.map(key => {
    return (data[key] || []).map((d, i) => formatToBarData(data, d, i, key, key.toLowerCase().includes('dola'), prices, useHistorical));
  }).flat();

  const chartSourceData = isAllCase ?
    totalDirectRepaymentsForChart :
    (data[`${selected}RepayedByDAO`] || [])
      .map((d, i) => formatToBarData(data, d, i, `${selected}RepayedByDAO`, isDolaCase, prices, useHistorical));

  const { chartData: barChartData } = useEventsAsChartData(chartSourceData, '_acc_', useUsd || isAllCase ? 'worth' : 'amount', false, false);
  const { chartData: dolaBadDebtEvo } = useEventsAsChartData(data?.dolaBadDebtEvolution || [], 'badDebt', 'delta', false, false);

  const items = Object.values(data?.badDebts || {}).map(item => {
    const priceUsd = prices[item.coingeckoId]?.usd || 1;
    const currentBadDebtUsd = item.badDebtBalance * priceUsd;
    const isDola = item.symbol === 'DOLA';
    const key = isDola ? 'totalDolaRepayedByDAO' : `${item.symbol.toLowerCase()}RepayedByDAO`;
    const totalBadDebtRepaidByDao = data[key]?.reduce((prev, curr) => prev + curr.amount, 0) || 0;

    const totalBadDebtRepaidByDaoUsd = totalBadDebtRepaidByDao * priceUsd;
    const totalBadDebtUsd = currentBadDebtUsd + totalBadDebtRepaidByDaoUsd;
    const totalBadDebt = item.badDebtBalance + totalBadDebtRepaidByDao;

    const convertedFor = !isDola ? 0 : data['debtConverterConversions']?.reduce((prev, curr) => prev + curr.convertedFor, 0) || 0;
    const convertedForUsd = convertedFor * data.iouExRate * dolaPrice;

    const dolaRepaidForIOU = !isDola ? 0 : data['dolaForIOUsRepayedByDAO']?.reduce((prev, curr) => prev + curr.amount, 0) || 0;
    const dolaRepaidForIOUUsd = dolaRepaidForIOU * dolaPrice;

    return {
      ...item,
      soldUsd: item.sold * priceUsd,
      convertedUsd: item.converted * priceUsd,
      convertedFor: convertedFor,
      convertedForUsd: convertedForUsd,
      soldForUsd: item.soldFor * priceUsd,
      badDebtUsd: currentBadDebtUsd,
      dolaRepaidForIOU,
      dolaRepaidForIOUUsd,
      priceUsd,
      totalBadDebtReduced: item.repaidViaDwf || 0 + item.sold + item.converted,
      totalBadDebtRepaidByDao,
      totalBadDebtRepaidByDaoUsd,
      totalBadDebtUsd,
      totalBadDebt,
      percRepaid: totalBadDebtRepaidByDaoUsd / totalBadDebtUsd * 100,
    };
  }).filter(item => item.badDebtBalance > 0.1);

  // add IOU debt to repay
  if (items.length > 0) {
    const priceUsd = prices['dola-usd']?.usd || 1;
    // amounts in UOU here
    const totalBadDebt = data['debtConverterConversions']?.reduce((prev, curr) => prev + curr.convertedFor, 0) || 0;
    const totalBadDebtUsd = totalBadDebt * data.iouExRate * priceUsd;
    // amounts in dola here
    const totalBadDebtRepaidByDao = data['dolaForIOUsRepayedByDAO']?.reduce((prev, curr) => prev + curr.amount, 0) || 0;
    const totalBadDebtRepaidByDaoUsd = totalBadDebtRepaidByDao * priceUsd;
    items.push({
      symbol: 'IOU',
      totalBadDebtRepaidByDao,
      totalBadDebtRepaidByDaoUsd,
      totalBadDebt,
      totalBadDebtUsd,
      badDebtBalance: totalBadDebt - totalBadDebtRepaidByDao,
      badDebtUsd: totalBadDebtUsd - totalBadDebtRepaidByDaoUsd,
      percRepaid: totalBadDebtRepaidByDaoUsd / totalBadDebtUsd * 100,
      image: "/assets/v2/dola-small.png",
    })
  }
  const indirectItems = items.filter(item => item.symbol !== 'IOU');

  const totalBadDebtReduced = (data[`${selected}RepayedByDAO`] || []).reduce((prev, curr) => prev + curr.amount, 0) || 0;
  // const item = items.find(item => item.symbol.toLowerCase() === selected) || { coingeckoId: 'dola-usd' };
  // const totalBadDebtReducedUsd = isDolaCase ? totalBadDebtReduced * prices[item?.coingeckoId]?.usd || 1 :
  //   chartSourceData.reduce((prev, curr) => prev + curr.worth, 0) || 0;  
  const totalBadDebtReducedUsd = chartSourceData.reduce((prev, curr) => prev + curr.worth, 0) || 0

  const barChartNbMonths = getMonthDiff(new Date('2022-05-01'), new Date());

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Bad Debts</title>
        <meta name="og:title" content="Inverse Finance - Bad Debts" />
        <meta name="og:description" content="Bad Debts" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Bad Debts Details" />
        <meta name="keywords" content="Inverse Finance, transparency, frontier, Bad Debts" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Bad Debts" hideAnnouncement={true} />
      {/* <TransparencyTabs active="bad-debts" /> */}
      <ErrorBoundary>
        <Flex w="full" maxW='6xl' direction="column" justify="center">
          <Stack w='full' alignItems='center' justify="center" direction={{ base: 'column', lg: 'column' }}>
            <Container
              label="DOLA bad debt Evolution"
              description={data?.timestamp ? `Last update: ${moment(data?.timestamp).fromNow()}` : 'Loading...'}
              noPadding
              headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
              }}
              right={
                <VStack spacing="0" alignItems={{ base: 'flex-start', md: 'flex-end' }}>
                  <Text fontSize="14px">Current DOLA bad debt:</Text>
                  <Text>{dolaBadDebtEvo.length > 0 && !!dolaBadDebtEvo[dolaBadDebtEvo.length - 1].y ? shortenNumber(dolaBadDebtEvo[dolaBadDebtEvo.length - 1].y, 2) : ''}</Text>
                </VStack>
              }
            >
              <DefaultCharts
                // direction={'row'}
                showMonthlyBarChart={false}
                maxChartWidth={1000}
                chartData={dolaBadDebtEvo}
                isDollars={false}
                smoothLineByDefault={false}
                showCustomizationBar={true}
                custombarChildren={
                  <HStack>
                    <Text color="mainTextColorLight" fontSize="14px">To change the zoom level, point an area and use the mouse scroll or change the boundaries in the mini-chart</Text>
                  </HStack>
                }
                barProps={{ eventName: 'Repayment' }}
                areaProps={{ id: 'bad-debt-chart', domainYpadding: 1000000, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
              />
            </Container>
            <Container
              noPadding
              label={
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <Select bgColor="containerContentBackground" fontWeight="bold" w={{ base: 'auto', sm: '300px' }} onChange={(e) => setSelected(e.target.value)}>
                    <option value="all">Total Repayments in USD</option>
                    <option value="totalDolaIncludingIOU">Total DOLA Repayments (IOU included)</option>
                    <option value="totalDola">Total DOLA Repayments (IOU excluded)</option>
                    <option value="dolaFrontier">DOLA Frontier Repayments</option>
                    <option value="nonFrontierDola">DOLA Fuse Repayments</option>
                    <option value="dolaForIOUs">IOU Repayments (in DOLA)</option>
                    <option value="eth">ETH Frontier Repayments</option>
                    <option value="wbtc">WBTC Frontier Repayments</option>
                    <option value="yfi">YFI Frontier Repayments</option>
                  </Select>
                  <HStack w="200px">
                    <Text fontSize="16px">
                      Historical USD
                    </Text>
                    <Switch value="true" isChecked={useHistorical} onChange={() => setUseHistorical(!useHistorical)} />
                  </HStack>
                  {
                    !isAllCase && <HStack w="150px">
                      <Text fontSize="16px">
                        In USD
                      </Text>
                      <Switch value="true" isChecked={useUsd} onChange={() => setUseUsd(!useUsd)} />
                    </HStack>
                  }
                </Stack>
              }
              headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
              }}
              right={
                <Stack pt={{ base: '2', sm: '0' }} justify="center" w='full' spacing={{ base: '1', sm: '0' }} alignItems="flex-end" direction={{ base: 'row', sm: 'column' }}>
                  {
                    !isAllCase && <Text>{preciseCommify(totalBadDebtReduced, isDolaCase ? 0 : 2)} {isDolaCase ? 'DOLA' : selected.toUpperCase()}</Text>
                  }
                  <Text fontWeight="bold">
                    {preciseCommify(totalBadDebtReducedUsd, 0, true)}
                  </Text>
                </Stack>
              }
            >
              <VStack w='full' alignItems="center" justify="center">
                {
                  prices && prices['dola-usd'] ? <DefaultCharts
                    direction={'column-reverse'}
                    showMonthlyBarChart={true}
                    maxChartWidth={1000}
                    chartData={barChartData}
                    isDollars={isAllCase ? true : useUsd}
                    areaProps={{ showMaxY: false, showTooltips: true, id: 'repayments-chart', allowZoom: false }}
                    barProps={{ months: [...Array(barChartNbMonths).keys()], eventName: 'Repayment' }}
                  /> :
                    <SkeletonBlob />
                }
              </VStack>
            </Container>
          </Stack>
          <Container
            noPadding
            label={`Bad debt recap & Repayments`}
            description={"At current prices"}
          // description={`Learn more about the bad debt, Debt Converter and Debt Repayer`}
          // href={'https://docs.inverse.finance/inverse-finance/inverse-finance/other/frontier'}
          >
            <Table
              items={items}
              columns={columns}
              enableMobileRender={false}
              keyName="symbol"
              defaultSort="percRepaid"
              defaultSortDir="desc"
              showTotalRow={true}
            />
          </Container>
          <Container
            noPadding
            label={`Annex: Bad Debt Converter and Repayer`}
            description={`Learn more about Debt Converter and Debt Repayer`}
            href={'https://docs.inverse.finance/inverse-finance/inverse-finance/other/frontier'}
            headerProps={{
              direction: { base: 'column', md: 'row' },
              align: { base: 'flex-start', md: 'flex-end' },
            }}
            right={
              <VStack fontSize="14px" spacing="0" alignItems={{ base: 'flex-start', md: 'flex-end' }}>
                <Text>IOUs held: <b>{preciseCommify(data?.iousHeld, 0)}</b></Text>
                <Text>IOUs in DOLA: <b>{preciseCommify(data?.iousDolaAmount, 0)}</b></Text>
              </VStack>
            }
          >
            <Table
              items={indirectItems}
              columns={indirectRepaymentsColumns}
              enableMobileRender={false}
              showTotalRow={true}
              keyName="symbol"
              defaultSort="symbol"
              defaultSortDir="asc"
            />
          </Container>
          <Container
            noPadding
            label={`Direct repayments transactions`}
            description="Includes DOLA repaid for IOUs"
          >
            <Table
              items={totalDirectRepaymentsForTable}
              columns={transactionsColumns}
              enableMobileRender={false}
              keyName="key"
              defaultSort="timestamp"
              defaultSortDir="desc"
              showTotalRow={true}
            />
          </Container>
        </Flex>
      </ErrorBoundary>
    </Layout>
  )
}

export default BadDebtPage
