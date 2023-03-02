import { Divider, Flex, SimpleGrid, Stack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { usePricesV2 } from '@app/hooks/usePrices'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { useCompensations, useDAO, usePOLs } from '@app/hooks/useDAO'
import { getFundsTotalUsd } from '@app/components/Transparency/Funds'
import { CHAIN_TOKENS } from '@app/variables/tokens'
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { PayrollDetails } from '@app/components/Transparency/PayrollDetails'
import { PoLsTable } from '@app/components/Transparency/PoLsTable'

export const Overview = () => {
  const { prices } = usePricesV2(true)
  const { pols } = usePOLs();

  const polsItems = pols.map(p => {
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
          <PoLsTable items={polsItems} />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Overview
