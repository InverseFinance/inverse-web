import { Flex, Stack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useLiquidityPools } from '@app/hooks/useDAO'
import { CHAIN_TOKENS } from '@app/variables/tokens'
import { PoLsTable } from '@app/components/Transparency/PoLsTable'
import { AggregatedLiquidityData } from '@app/components/Transparency/AggregatedLiquidityData'

export const Overview = () => {
  const { liquidity, timestamp } = useLiquidityPools();

  const polsItems = liquidity.map(p => {
    return {
      name: `${CHAIN_TOKENS[p.chainId][p.address]?.symbol}`,
      pol: p.ownedAmount,
      polDom: p.perc,
      ...p,
    }
  });

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
      <Flex w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="4" px="5" maxWidth="1200px" w='full'>
          <PoLsTable items={polsItems} timestamp={timestamp} />
          <Stack pt='4' direction={{ base: 'column', md: 'row' }} w='full' alignItems='flex-start'>
            <AggregatedLiquidityData items={polsItems.filter(lp => lp.lpName)} containerProps={{ label: 'TOTAL DOLA Liquidity summary' }} />
            <AggregatedLiquidityData items={polsItems.filter(lp => lp.lpName.includes('DOLA'))} containerProps={{ label: 'DOLA Stable Liquidity Summary' }} />
            <AggregatedLiquidityData items={polsItems.filter(lp => lp.lpName.includes('DOLA'))} containerProps={{ label: 'DOLA Volatile Summary' }} />
          </Stack>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Overview
