import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useAccount } from '@app/hooks/misc';
import { JDolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';
import { useState } from 'react';
import { StakeJDolaUI } from '@app/components/JuniorTranches/StakeJDolaUI';


export const JdolaPage = () => {
  const account = useAccount();
  const [debouncedTotalStables, setDebouncedTotalStables] = useState(0);
  const [topStableInited, setTopStableInited] = useState(false);
  const [lastTopStable, setLastTopStable] = useState(null);

  // const { tokenAndBalances, totalStables, topStable, useDolaAsMain, isLoading: isLoadingStables } = useSavingsOpportunities(account);

  // useDebouncedEffect(() => {
  //   setDebouncedTotalStables(totalStables);
  // }, [totalStables], 500);

  // useEffect(() => {
  //   if(!isLoadingStables && !topStableInited && !!topStable?.token?.address){
  //     setTopStableInited(true);
  //     setLastTopStable(topStable);
  //   }
  // }, [topStable?.token?.address, isLoadingStables, topStableInited]);

  // const _totalStables = totalStables > 0 ? totalStables : debouncedTotalStables;

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - jDOLA</title>
        <meta name="og:title" content="Inverse Finance - jDOLA" />
        <meta name="og:description" content="jDOLA" />
        <meta name="description" content="jDOLA is a decentralized yield-bearing stablecoin that leverages organic yield from the DOLA Savings Account" />
        <meta name="keywords" content="Inverse Finance, jDOLA, yield-bearing stablecoin, staked DOLA" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/jDOLA-v3.jpeg" />
      </Head>
      <AppNav active="Stake" activeSubmenu="jDOLA" hideAnnouncement={true} />
      <JDolaStakingTabs />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <Stack
          spacing={{ base: 4, xl: 0 }}
          alignItems="space-between"
          justify="space-between"
          w='full'
          direction={{ base: 'column', xl: 'row' }}
        >
          <VStack spacing="10" alignItems={"center"} w={{ base: 'full' }}>
            {/* <SavingsOpportunities tokenAndBalances={tokenAndBalances} totalStables={_totalStables} /> */}
            <StakeJDolaUI isLoadingStables={false} useDolaAsMain={true} topStable={lastTopStable} />
          </VStack>
        </Stack>
      </VStack>
    </Layout>
  )
}

export default JdolaPage