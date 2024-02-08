import { HStack, VStack, Text } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader';
import { preciseCommify } from '@app/util/misc';
import { DolaStakingActivity } from '@app/components/sDola/DolaStakingActivity';
import { useDolaStakingActivity, useStakedDola } from '@app/util/dola-staking';
import { useDBRPrice } from '@app/hooks/useDBR';
import { DolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';
import { DsaStakingChart } from '@app/components/F2/DolaStaking/DolaStakingChart';
import { SkeletonBlob } from '@app/components/common/Skeleton';

export const DsaStatsPage = () => {
  const { events, timestamp } = useDolaStakingActivity(undefined, 'dsa');
  const { priceDola: dbrDolaPrice } = useDBRPrice();
  const { dsaTotalSupply, isLoading } = useStakedDola(dbrDolaPrice);
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - DSA stats</title>
        <meta name="og:title" content="Inverse Finance - DSA stats" />
        <meta name="og:description" content="DSA stats" />
        <meta name="description" content="DSA stats" />
        <meta name="keywords" content="Inverse Finance, DOLA, DBR, DOLA Savings Account, stats" />
      </Head>
      <AppNav active="Stake" />
      <DolaStakingTabs defaultIndex={3} />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        {
          isLoading ? <SkeletonBlob /> : <DsaStakingChart events={events} />
        }
        <DolaStakingActivity
          events={events}
          lastUpdate={timestamp}
          title="DSA Staking activity"
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
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(dsaTotalSupply, 2)}</Text>
                }
              </VStack>
            </HStack>
          }
        />
      </VStack>
    </Layout>
  )
}

export default DsaStatsPage