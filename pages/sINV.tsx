import { Stack, VStack, Text, SimpleGrid } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useAccount } from '@app/hooks/misc';
import { StakeInvUI } from '@app/components/sINV/StakeInvUI';
import { SINVTabs } from '@app/components/sINV/SINVTabs';
import { useInvStakingActivity, useStakedInvBalance } from '@app/util/sINV';
import { InfoMessage } from '@app/components/common/Messages';
import { InvStakingActivity } from '@app/components/sINV/InvStakingActivity';
import { NavButtons } from '@app/components/common/Button';
import { useState } from 'react';
import { useAppTheme } from '@app/hooks/useAppTheme';
import { SInvPriceChart } from '@app/components/Transparency/sInvPriceChart';

export const SinvPage = () => {
  const account = useAccount();
  const { themeStyles } = useAppTheme();
  const [tabVersion, setTabVersion] = useState<'V1' | 'V2'>('V1');
  const { isLoading, accountEvents, events } = useInvStakingActivity(account, 'sinv');

  const { assets: sINVV1Balance, shares: v1Shares } = useStakedInvBalance(account, 'V1');

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sINV</title>
        <meta name="og:title" content="Inverse Finance - sINV" />
        <meta name="og:description" content="sINV" />
        <meta name="description" content="sINV is a yield-bearing wrapped version of INV, where DBR rewards are auto-compounded into more INV" />
        <meta name="keywords" content="Inverse Finance, sINV, yield-bearing token, staked INV, auto-compounding" />
        <meta name="og:image" content="https://inverse.finance/assets/sINVx512.png" />
      </Head>
      <AppNav active="Stake" activeSubmenu="sINV" />
      <SINVTabs />
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
            <Text as="h1" fontSize="24px" fontWeight="bold">
              sINV is the hassle-free alternative to staking your INV on FiRM
            </Text>
            <InfoMessage
              alertProps={{ w: 'full' }}
              description={
                <SimpleGrid fontSize="18px" columns={{ base: 1, md: 2 }}>
                  <Text>- Auto-compounding rewards</Text>
                  <Text>- Reduced gas costs</Text>
                  <Text>- Yield-bearing fungible token</Text>
                  <Text>- Extra yield possible with LPs</Text>
                  <Text>- Portable across chains</Text>
                  <Text>- Continuous INV buying pressure</Text>
                </SimpleGrid>
              }
            />
            {
              v1Shares >= 0.1 ? <VStack bgColor={{ base: 'inherit', md: themeStyles.colors.navBarBackgroundColor }} pt="100px" position="relative" w='full' pb="8" spacing="0" border={{ base: 'inherit', md: `1px solid ${themeStyles.colors.navBarBorderColor}` }} borderTop="none" borderRadius="0 0 10px 10px">
                <NavButtons                  
                  textProps={{ fontSize: "30px" }}
                  position="absolute"
                  w="105%"
                  top="0"
                  left="-2.5%"
                  active={tabVersion}
                  options={["V1", "V2"]}
                  onClick={(v) => setTabVersion(v)}
                />
                <StakeInvUI showVersion={true} display={tabVersion === 'V1' ? 'flex' : 'none'} version="V1" />
                <StakeInvUI showVersion={true} display={tabVersion === 'V2' ? 'flex' : 'none'} version="V2" />
              </VStack>
                :
                <VStack bgColor={{ base: 'inherit', md: themeStyles.colors.navBarBackgroundColor }} w='full' py="8" spacing="0" border={{ base: 'inherit', md: `1px solid ${themeStyles.colors.navBarBorderColor}` }} borderRadius="10px">
                  <StakeInvUI showVersion={false} version="V2" />
                </VStack>
            }
            <SInvPriceChart />
          </VStack>
        </Stack>        
        {
          !!account && accountEvents?.length > 0 && <InvStakingActivity events={accountEvents} title="My Staking activity" />
        }
      </VStack>
    </Layout>
  )
}

export default SinvPage