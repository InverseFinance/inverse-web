import { HStack, VStack, Text } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader';
import { preciseCommify } from '@app/util/misc';
import { DolaStakingActivity } from '@app/components/sDola/DolaStakingActivity';
import { useDolaStakingActivity, useDolaStakingEvolution, useStakedDola } from '@app/util/dola-staking';
import { useDBRPrice } from '@app/hooks/useDBR';
import { DolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';
import { SDolaStakingChart, SDolaStakingEvolutionChart } from '@app/components/F2/DolaStaking/DolaStakingChart';
import { SkeletonBlob } from '@app/components/common/Skeleton';
import { shortenNumber } from '@app/util/markets';

export const SDolaStatsPage = () => {
  const { events, timestamp } = useDolaStakingActivity(undefined, 'sdola');
  const { evolution } = useDolaStakingEvolution();
  const { priceDola: dbrDolaPrice } = useDBRPrice();
  const { sDolaSupply, sDolaTotalAssets, apr, isLoading } = useStakedDola(dbrDolaPrice);
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sDOLA stats</title>
        <meta name="og:title" content="Inverse Finance - sDOLA stats" />
        <meta name="og:description" content="sDOLA stats" />
        <meta name="description" content="sDOLA stats" />
        <meta name="keywords" content="Inverse Finance, sDOLA, yield-bearing stablecoin, staked DOLA, stats" />
      </Head>
      <AppNav active="sDOLA" activeSubmenu="sDOLA Stats" />
      <DolaStakingTabs defaultIndex={2} />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        {isLoading ? <SkeletonBlob /> : <SDolaStakingChart events={events} />}
        {/* {isLoading ? <SkeletonBlob /> : <SDolaStakingEvolutionChart evolution={evolution} attribute="sDolaTotalAssets" yLabel="DOLA staked" title="DOLA staked in sDOLA" />} */}
        { isLoading ? <SkeletonBlob /> : <SDolaStakingEvolutionChart isPerc={true} evolution={evolution} attribute="apr" yLabel="APR" title={`APR evolution (current: ${shortenNumber(apr||0, 2)}%)`} /> }
        <DolaStakingActivity
          events={events}
          lastUpdate={timestamp}
          title="sDOLA Staking activity"
          headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
          }}
          right={
            <HStack justify="space-between" spacing="4">
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">sDOLA supply</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">
                      {preciseCommify(sDolaSupply, 2)}
                    </Text>
                }
              </VStack>
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">Total DOLA staked</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">
                      {preciseCommify(sDolaTotalAssets, 2)}
                    </Text>
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