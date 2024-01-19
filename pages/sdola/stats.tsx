import { HStack, VStack, Text } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader';
import { preciseCommify } from '@app/util/misc';
import { DolaStakingActivity, useDolaStakingActivity } from '@app/components/sDola/DolaStakingActivity';
import { useStakedDola } from '@app/util/dola-staking';
import { useDBRPrice } from '@app/hooks/useDBR';
import { DolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';
import { SDolaStakingChart } from '@app/components/F2/DolaStaking/DolaStakingChart';

export const SDolaStatsPage = () => {
  const { events } = useDolaStakingActivity(undefined, 'sdola');
  const { priceDola: dbrDolaPrice } = useDBRPrice();
  const { sDolaSupply, isLoading } = useStakedDola(dbrDolaPrice);
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sDOLA stats</title>
        <meta name="og:title" content="Inverse Finance - DSA stats" />
        <meta name="og:description" content="sDOLA stats" />
        <meta name="description" content="sDOLA stats" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR, sDOLA" />
      </Head>
      <AppNav active="Swap" activeSubmenu="Buy DBR (auction)" />
      <DolaStakingTabs defaultIndex={2} />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <SDolaStakingChart events={events} />
        <DolaStakingActivity
          events={events}
          title="sDOLA Staking activity"
          headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
          }}
          right={
            <HStack justify="space-between" spacing="4">
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">Total DOLA staked</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(sDolaSupply, 2)}</Text>
                }
              </VStack>
            </HStack>
          }
        />
      </VStack>
    </Layout>
  )
}

export default SDolaStatsPage