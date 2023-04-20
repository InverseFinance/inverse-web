import { Flex, Stack, VStack, Text, Divider, HStack, useDisclosure } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useLiquidityPools, useLiquidityPoolsAggregatedHistory } from '@app/hooks/useDAO'
import { LiquidityPoolsTable } from '@app/components/Transparency/LiquidityPoolsTable'
import { AggregatedLiquidityData } from '@app/components/Transparency/AggregatedLiquidityData'
import { InfoMessage } from '@app/components/common/Messages';
import { Funds } from '@app/components/Transparency/Funds';
import { capitalize, preciseCommify } from '@app/util/misc';
import { RadioSelector } from '@app/components/common/Input/RadioSelector';
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock';
import { useState } from 'react';
import moment from 'moment';
import { useTokensData } from '@app/hooks/useMarkets';
import Link from '@app/components/common/Link';
import { usePricesV2 } from '@app/hooks/usePrices';
import { useEventsAsChartData } from '@app/hooks/misc';
import { DefaultCharts } from '@app/components/Transparency/DefaultCharts';
import InfoModal from '@app/components/common/Modal/InfoModal';

const groupLpsBy = (lps: any[], attribute: string) => {
  const items = Object.entries(
    lps.reduce((prev, curr) => {
      return { ...prev, [curr[attribute]]: (prev[curr[attribute]] || 0) + curr.tvl };
    }, {})
  ).map(([key, val]) => {
    const symbol = key
      .replace('true', 'With Fed')
      .replace('false', 'Without Fed')
      .replace(/-exchange/i, '')
      .replace(/Arbitrum/i, 'ARB')
      .replace(/optimism/i, 'OP')
    return { balance: val, usdPrice: 1, token: { symbol } }
  });
  // return items;
  items.sort((a, b) => b.balance - a.balance);
  if (items.length > 6) {
    const top5 = items.splice(0, 6);
    const others = items.reduce((prev, curr) => ({ balance: prev.balance + curr.balance }), { balance: 0 });
    return top5.concat({ balance: others.balance, usdPrice: 1, token: { symbol: 'Others' } });
  } else {
    return items;
  }
}

const LINKS = {
  'DBR': 'https://www.coingecko.com/en/coins/dola-borrowing-right',
  'DOLA': 'https://www.coingecko.com/en/coins/dola-usd',
  'INV': 'https://www.coingecko.com/en/coins/inverse-finance',
}
const cgIds = {
  'DBR': 'dola-borrowing-right',
  'DOLA': 'dola-usd',
  'INV': 'inverse-finance',
}

export const Liquidity = () => {
  const { liquidity, timestamp } = useLiquidityPools();
  const { aggregatedHistory } = useLiquidityPoolsAggregatedHistory(false);
  const { dola, inv, dbr } = useTokensData();
  const { prices } = usePricesV2();
  const [category, setCategory] = useState('DOLA');
  const [categoryChartHisto, setCategoryChartHisto] = useState(category);
  const [histoAttribute, setHistoAttribute] = useState('tvl');
  const [histoIsPerc, setHistoIsPerc] = useState(false);
  const [histoAttributeLabel, setHistoAttributeLabel] = useState('TVL');
  const [histoTitle, setHistoTitle] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { chartData } = useEventsAsChartData(aggregatedHistory[categoryChartHisto] || [], histoAttribute, histoAttribute, false, false);

  const volumes = { DOLA: dola?.volume || 0, INV: inv?.volume || 0, DBR: dbr?.volume || 0 }

  const toExcludeFromAggregate = liquidity.filter(lp => !!lp.deduce).map(lp => lp.deduce).flat();
  const itemsWithoutChildren = liquidity.filter(lp => !toExcludeFromAggregate.includes(lp.address));

  const categoryLps = itemsWithoutChildren.filter(lp => lp.lpName.includes(category));
  const byPairs = groupLpsBy(categoryLps, 'lpName');
  const byFed = groupLpsBy(categoryLps, 'isFed');
  const byChain = groupLpsBy(categoryLps, 'networkName')//.map(f => ({ ...f, token: { symbol: NETWORKS_BY_CHAIN_ID[f.token.symbol].name } }));
  const byProtocol = groupLpsBy(categoryLps, 'project').map(f => ({ ...f, token: { symbol: capitalize(f.token.symbol) } }));

  const handleOpenHistoChart = (isStable: boolean, exclude: string, attribute: string, label: string, title: string, isPerc: boolean | undefined) => {
    const isDola = category === 'DOLA';
    setHistoAttribute(attribute);
    setCategoryChartHisto(`${category}${isStable === true ? '-stable' : isStable === false ? '-volatile' : ''}${exclude ? '-NON_DOLA' : isDola ? '' : '-DOLA'}`);
    setHistoAttributeLabel(label);
    setHistoTitle(title);
    setHistoIsPerc(!!isPerc);
    onOpen();
  }

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Liquidity</title>
        <meta name="og:title" content="Inverse Finance - Liquidity" />
        <meta name="og:description" content="Liquidity Details" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Liquidity Details" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, liquidity, pol" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Liquidity" hideAnnouncement={true} />
      <TransparencyTabs active="liquidity" />
      <InfoModal
        title={`${histoTitle} ${histoAttributeLabel} over time`}
        onClose={onClose}
        onOk={onClose}
        isOpen={isOpen}
        minW={{ base: '98vw', lg: '850px' }}
        okLabel="Close"
      >
        <VStack pl='8' w='full' alignItems="center" justifu='center'>
          <DefaultCharts chartData={chartData} isDollars={!histoIsPerc} isPerc={histoIsPerc} areaProps={{}} />
        </VStack>
      </InfoModal>
      <Flex pt='4' w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="4" px="5" maxWidth="1200px" w='full'>
          <Text fontSize="12px">
            {`Last update: ${timestamp ? moment(timestamp).fromNow() : ''}`}
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }}>
            <RadioSelector
              defaultValue="DOLA"
              value={category}
              setChosen={(v) => setCategory(v)}
              items={[
                { value: 'DOLA', label: <UnderlyingItemBlock symbol="DOLA" /> },
                { value: 'INV', label: <UnderlyingItemBlock symbol="INV" /> },
                { value: 'DBR', label: <UnderlyingItemBlock symbol="DBR" /> },
              ]}
            />
            <HStack>
              <VStack w='130px' spacing="0" alignItems={{ base: 'flex-start', sm: "flex-end" }}>
                <Text>{category} 24h Vol.</Text>
                <Link textDecoration="underline" style={{ 'text-decoration-skip-ink': 'none' }} isExternal={true} target="_blank" fontWeight="bold" href={LINKS[category]}>
                  {volumes[category] ? preciseCommify(volumes[category], 0, true) : '-'}
                </Link>
              </VStack>
              <VStack w='130px' spacing="0" alignItems={{ base: 'flex-start', sm: "flex-end" }}>
                <Text>{category} Price</Text>
                <Link textDecoration="underline" style={{ 'text-decoration-skip-ink': 'none' }} isExternal={true} target="_blank" fontWeight="bold" href={LINKS[category]}>
                  {!!prices && prices[cgIds[category]]?.usd ? preciseCommify(prices[cgIds[category]]?.usd, 4, true) : '-'}
                </Link>
              </VStack>
            </HStack>
          </Stack>
          {
            category === 'DOLA' ?
              <Stack py='4' direction={{ base: 'column', md: 'row' }} w='full' alignItems='flex-start'>
                <AggregatedLiquidityData handleClick={handleOpenHistoChart} items={liquidity} include='DOLA' containerProps={{ label: `TOTAL DOLA Liquidity` }} />
                <AggregatedLiquidityData handleClick={handleOpenHistoChart} items={liquidity} include='DOLA' isStable={true} containerProps={{ label: 'DOLA Stable Liquidity' }} />
                <AggregatedLiquidityData handleClick={handleOpenHistoChart} items={liquidity} include='DOLA' isStable={false} containerProps={{ label: 'DOLA Volatile Liquidity' }} />
              </Stack>
              :
              <Stack py='4' direction={{ base: 'column', md: 'row' }} w='full' alignItems='flex-start'>
                <AggregatedLiquidityData handleClick={handleOpenHistoChart} items={liquidity} include={category} containerProps={{ label: `TOTAL ${category} Liquidity` }} />
                <AggregatedLiquidityData handleClick={handleOpenHistoChart} items={liquidity} include={[category, 'DOLA']} containerProps={{ label: `${category}-DOLA Liquidity` }} />
                <AggregatedLiquidityData handleClick={handleOpenHistoChart} items={liquidity} include={category} exclude='DOLA' containerProps={{ label: `${category}-NON_DOLA Liquidity` }} />
              </Stack>
          }
          <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between" >
            <VStack alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
              <Text fontWeight="bold">{category} LPs TVL By Pair</Text>
              <Funds innerRadius={5} funds={byPairs} chartMode={true} showTotal={false} showChartTotal={false} />
            </VStack>
            <VStack alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
              <Text fontWeight="bold">{category} LPs TVL By Chain</Text>
              <Funds innerRadius={5} funds={byChain} chartMode={true} showTotal={false} showChartTotal={false} />
            </VStack>
            <VStack alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
              <Text fontWeight="bold">{category} LPs TVL By Protocol</Text>
              <Funds innerRadius={5} funds={byProtocol} chartMode={true} showTotal={false} showChartTotal={false} />
            </VStack>
            <VStack alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
              <Text fontWeight="bold">{category} LPs TVL By Strategy</Text>
              <Funds innerRadius={5} funds={byFed} chartMode={true} showTotal={false} showChartTotal={false} />
            </VStack>
          </Stack>
          <Divider my="4" />
          <LiquidityPoolsTable items={liquidity} timestamp={timestamp} />
          <InfoMessage
            alertProps={{ w: 'full', my: '4' }}
            description="Note: some pools are derived from other pools, Aura LPs take Balancer LPs as deposits for example, their TVLs will not be summed in the aggregated data."
          />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Liquidity
