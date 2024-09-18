import { Stack, VStack, Text, SimpleGrid, Divider, ScaleFade } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useAccount } from '@app/hooks/misc';
import { useDbrAuctionActivity } from '@app/util/dbr-auction';
import { StakeInvUI } from '@app/components/sINV/StakeInvUI';
import { SINVTabs } from '@app/components/sINV/SINVTabs';
import { useInvStakingActivity, useStakedInvBalance } from '@app/util/sINV';
import { InfoMessage } from '@app/components/common/Messages';
import { InvStakingActivity } from '@app/components/sINV/InvStakingActivity';
import { NavButtons } from '@app/components/common/Button';
import { useState } from 'react';
import { useAppTheme } from '@app/hooks/useAppTheme';

export const SinvPage = () => {
  const account = useAccount();
  const { themeStyles } = useAppTheme();
  const [tabVersion, setTabVersion] = useState<'V1' | 'V2'>('V2');
  const { isLoading, accountEvents, events } = useInvStakingActivity(account, 'sinv');

  // const { isLoading: isLoadingBuys, events: buyEvents } = useDbrAuctionActivity();
  // const sinvBuyEvents = buyEvents.filter(e => e.auctionType === 'sINV');

  const { assets: sINVV1Balance } = useStakedInvBalance(account, 'V1');

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
                <SimpleGrid columns={{ base: 1, md: 2 }}>
                  <Text>- Auto-compounding staking rewards, no need to claim manually</Text>
                  <Text>- Reduced gas costs</Text>
                  <Text>- Yield-bearing fungible token</Text>
                  <Text>- Can earn additional yield by being deposited in Liquidity Pools</Text>
                  <Text>- Portable across chains</Text>
                  <Text>- Creates continuous buying pressure on INV</Text>
                </SimpleGrid>
              }
            />
            {
              sINVV1Balance >= 1 ? <VStack bgColor={{ base: 'inherit', md: themeStyles.colors.navBarBackgroundColor }} pt="60px" position="relative" w='full' pb="8" spacing="0" border={{ base: 'inherit', md: `1px solid ${themeStyles.colors.navBarBorderColor}` }} borderTop="none" borderRadius="0 0 10px 10px">
                <NavButtons
                  position="absolute"
                  w="105%"
                  top="0"
                  left="-2.5%"
                  active={tabVersion}
                  options={["V1", "V2"]}
                  onClick={(v) => setTabVersion(v)}
                />
                <StakeInvUI display={tabVersion === 'V1' ? 'flex' : 'none'} version="V1" />
                <StakeInvUI display={tabVersion === 'V2' ? 'flex' : 'none'} version="V2" />
              </VStack>
                :
                <VStack bgColor={{ base: 'inherit', md: themeStyles.colors.navBarBackgroundColor }} w='full' py="8" spacing="0" border={{ base: 'inherit', md: `1px solid ${themeStyles.colors.navBarBorderColor}` }} borderRadius="10px">
                  <StakeInvUI version="V2" />
                </VStack>
            }
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