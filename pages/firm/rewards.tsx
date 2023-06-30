import { VStack, Text, Stack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useAccount } from '@app/hooks/misc'
import { useAccountF2Markets, useDBRMarkets } from '@app/hooks/useDBR'
import { useSimUserRewards, useUserRewards } from '@app/hooks/useFirm'
import { preciseCommify } from '@app/util/misc'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import { FirmRewardWrapper, FirmRewards } from '@app/components/F2/rewards/FirmRewardWrapper'
import { useEffect, useState } from 'react'
import { zapperRefresh } from '@app/util/f2'

export const FirmRewardsPage = () => {
    const account = useAccount();
    const { themeStyles } = useAppTheme();
    const { markets } = useDBRMarkets();
    const [extraUsd, setExtraUsd] = useState(0);
    const accountMarkets = useAccountF2Markets(markets, account);
    accountMarkets?.sort((a, b) => b.deposits - a.deposits);

    const { claimableRewards, isLoading } = useSimUserRewards(account);

    // inv market: via extraUsd (will be from simulated or on-chain)
    const totalRewardsUSD = extraUsd + claimableRewards?.filter(d => !d.market.isInv)?.reduce((prev, curr) => {
        return prev + curr.tokens
            .filter(t => t.metaType === 'claimable')
            .reduce((tprev, tcurr) => tprev + tcurr.balanceUSD, 0);
    }, 0);

    const depositsWithRewards = accountMarkets?.filter(m => m.hasClaimableRewards)
        .reduce((prev, curr) => prev + curr.deposits * curr.price, 0);

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - FiRM rewards</title>
                <meta name="og:description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="og:image" content="https://images.ctfassets.net/kfs9y9ojngfc/6E4HUcq7GOoFsN5IiXVhME/dbb642baae622681d36579c1a092a6df/FiRM_Launch_Blog_Hero.png?w=3840&q=75" />
            </Head>
            <AppNav active="Earn" activeSubmenu="FiRM rewards" />
            <ErrorBoundary>
                <VStack spacing='4' pt={{ base: 4, md: 8, '2xl': 20 }} w='full' px='4' maxW={{ base: '98vw', 'md': '1200px' }}>
                    <Stack spacing="8" direction={{ base: 'column', sm: 'row' }}>
                        <VStack border={`1px solid ${themeStyles.colors.mainTextColor}`} borderRadius='5' py='4' px='8'>
                            <Text fontSize="18px">Total deposits</Text>
                            <Text fontSize="20px" fontWeight="bold">{preciseCommify(depositsWithRewards, 2, true)}</Text>
                        </VStack>
                        <VStack border={`1px solid ${themeStyles.colors.mainTextColor}`} borderRadius='5' py='4' px='8'>
                            <Text fontSize="18px">Total claimable</Text>
                            <Text fontSize="20px" fontWeight="bold">{preciseCommify(totalRewardsUSD, 2, true)}</Text>
                        </VStack>
                    </Stack>
                    {
                        isLoading ? <SkeletonBlob />
                            :
                            accountMarkets
                                .filter(market => market.hasClaimableRewards)
                                .map(market => {
                                    // via on api
                                    const rewardsInfos = claimableRewards.find(a =>  [a.appGroup, a.market.zapperAppGroup].includes(market.zapperAppGroup));
                                    // plus via on chain data
                                    if (market.isInv) {
                                        return <FirmRewardWrapper
                                            key={market.address}
                                            market={market}
                                            showMarketBtn={true}
                                            escrow={market.escrow}
                                            onLoad={(v) => setExtraUsd(v)}
                                        />
                                    }
                                    
                                    return <FirmRewards
                                        key={market.address}
                                        market={market}
                                        rewardsInfos={rewardsInfos}
                                        showMarketBtn={true}
                                        escrow={market.escrow}
                                    />
                                })
                    }
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmRewardsPage
