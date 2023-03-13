import { Flex, Stack, VStack, Text, Divider } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useLiquidityPools } from '@app/hooks/useDAO'
import { CHAIN_TOKENS } from '@app/variables/tokens'
import { PoLsTable } from '@app/components/Transparency/PoLsTable'
import { AggregatedLiquidityData } from '@app/components/Transparency/AggregatedLiquidityData'
import { InfoMessage } from '@app/components/common/Messages';
import { Funds } from '@app/components/Transparency/Funds';
import { capitalize } from '@app/util/misc';
import { RadioSelector } from '@app/components/common/Input/RadioSelector';
import { UnderlyingItemBlock } from '@app/components/common/Assets/UnderlyingItemBlock';
import { useState } from 'react';
import moment from 'moment';

const groupLpsBy = (lps: any[], attribute: string) => {
  return Object.entries(
    lps.reduce((prev, curr) => {
      return { ...prev, [curr[attribute]]: (prev[curr[attribute]] || 0) + curr.tvl };
    }, {})
  ).map(([key, val]) => {
    return { balance: val, usdPrice: 1, token: { symbol: key } }
  });
}

export const Liquidity = () => {
  const { liquidity, timestamp } = useLiquidityPools();
  const [category, setCategory] = useState('DOLA');

  const polsItems = liquidity.map(p => {
    return {
      name: `${CHAIN_TOKENS[p.chainId][p.address]?.symbol}`,
      pol: p.ownedAmount,
      polDom: p.perc,
      ...p,
    }
  });

  const toExcludeFromAggregate = polsItems.filter(lp => !!lp.deduce).map(lp => lp.deduce).flat();
  const itemsWithoutChildren = polsItems.filter(lp => !toExcludeFromAggregate.includes(lp.address));

  const categoryLps = itemsWithoutChildren.filter(lp => lp.lpName.includes(category));
  const byPairs = groupLpsBy(categoryLps, 'lpName');
  const byChain = groupLpsBy(categoryLps, 'networkName')//.map(f => ({ ...f, token: { symbol: NETWORKS_BY_CHAIN_ID[f.token.symbol].name } }));
  const byProtocol = groupLpsBy(categoryLps, 'project').map(f => ({ ...f, token: { symbol: capitalize(f.token.symbol) } }));

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
      <Flex pt='4' w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="4" px="5" maxWidth="1200px" w='full'>
          <Text fontSize="12px">
            {`Last update: ${timestamp ? moment(timestamp).fromNow() : ''}`}
          </Text>
          <Flex>
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
          </Flex>
          {
            category === 'DOLA' ?
              <Stack py='4' direction={{ base: 'column', md: 'row' }} w='full' alignItems='flex-start'>
                <AggregatedLiquidityData items={polsItems.filter(lp => lp.lpName.includes('DOLA'))} containerProps={{ label: 'TOTAL DOLA Liquidity' }} />
                <AggregatedLiquidityData items={polsItems.filter(lp => lp.isStable && lp.lpName.includes('DOLA'))} containerProps={{ label: 'DOLA Stable Liquidity' }} />
                <AggregatedLiquidityData items={polsItems.filter(lp => !lp.isStable && lp.lpName.includes('DOLA'))} containerProps={{ label: 'DOLA Volatile Liquidity' }} />
              </Stack>
              :
              <Stack py='4' direction={{ base: 'column', md: 'row' }} w='full' alignItems='flex-start'>
                <AggregatedLiquidityData items={polsItems.filter(lp => lp.lpName.includes(category))} containerProps={{ label: `TOTAL ${category} Liquidity` }} />
                <AggregatedLiquidityData items={polsItems.filter(lp => lp.lpName.includes(category) && lp.lpName.includes('DOLA'))} containerProps={{ label: `${category}-DOLA Liquidity` }} />
                <AggregatedLiquidityData items={polsItems.filter(lp => lp.lpName.includes(category) && !lp.lpName.includes('DOLA'))} containerProps={{ label: `${category}-NON_DOLA Liquidity` }} />
              </Stack>
          }
          <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between" >
            <VStack alignItems="flex-start" direction="column-reverse">
              <Text fontWeight="bold">{category} LPs TVL By Pair</Text>
              <Funds innerRadius={5} funds={byPairs} chartMode={true} showTotal={false} showChartTotal={false} />
            </VStack>
            <VStack alignItems="flex-start" direction="column-reverse">
              <Text fontWeight="bold">{category} LPs TVL By Chain</Text>
              <Funds innerRadius={5} funds={byChain} chartMode={true} showTotal={false} showChartTotal={false} />
            </VStack>
            <VStack alignItems="flex-start" direction="column-reverse">
              <Text fontWeight="bold">{category} LPs TVL By Protocol</Text>
              <Funds innerRadius={5} funds={byProtocol} chartMode={true} showTotal={false} showChartTotal={false} />
            </VStack>
          </Stack>
          <Divider my="4" />
          <PoLsTable items={polsItems} timestamp={timestamp} />
          <InfoMessage
            alertProps={{ w: 'full', my: '4' }}
            description="NB: some pools are derived from other pools, Aura LPs take Balancer LPs as deposits for example, their TVLs will not be summed in the aggregated data."
          />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Liquidity
