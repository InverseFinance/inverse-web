import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { VStack, Text, HStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { F2CombinedForm } from '@app/components/F2/forms/F2CombinedForm'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'
import { MarketBar } from '@app/components/F2/Infos/InfoBar'
import React from 'react'
import { F2Context } from '@app/components/F2/F2Contex'
import { useRouter } from 'next/router'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { FirmGovToken, InvInconsistentFirmDelegation } from '@app/components/F2/GovToken/FirmGovToken'
import { FirstTimeModal } from '@app/components/F2/Modals/FirstTimeModal'
import { FirmRewardWrapper } from '@app/components/F2/rewards/FirmRewardWrapper'
import { CvxCrvPreferences } from '@app/components/F2/rewards/CvxCrvPreferences'
import { DailyLimitCountdown } from '@app/components/common/Countdown'
import Container from '@app/components/common/Container'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { shortenNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { WorthEvoChartWrapper } from '@app/components/F2/WorthEvoChartContainer'
import { DbrV1IssueModal } from '@app/components/F2/Modals/DbrV1IssueIModal'
import { useMultisig } from '@app/hooks/useSafeMultisig'
import Link from '@app/components/common/Link'
import { FirmInsuranceCover } from '@app/components/common/InsuranceCover'

const { F2_MARKETS } = getNetworkConfigConstants();

const useDefaultPreview = ['CRV', 'cvxCRV', 'cvxFXS', 'st-yCRV']

export const F2MarketPage = ({ market }: { market: string }) => {
    const router = useRouter();
    const { isMultisig } = useMultisig();
    const { markets } = useDBRMarkets(market);
    const f2market = markets.length > 0 && !!market ? markets[0] : undefined;

    const needCountdown = !f2market?.borrowPaused && f2market?.leftToBorrow < f2market?.dailyLimit && f2market?.dolaLiquidity > 0 && f2market?.leftToBorrow < f2market?.dolaLiquidity && shortenNumber(f2market?.dolaLiquidity, 2) !== shortenNumber(f2market?.leftToBorrow, 2);

    const backToMarkets = () => {
        router.push(router.asPath.replace(`/${market}`, '').replace(/#step[0-9]/i, ''));
    }

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM {f2market?.name}</title>
                <meta name="og:description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="og:image" content={useDefaultPreview.includes(market) ? "https://inverse.finance/assets/social-previews/firm-page.png" : `https://inverse.finance/assets/social-previews/markets/${market}.jpeg`} />
            </Head>
            <AppNav active={'Markets'} activeSubmenu={market?.isInv ? 'Stake INV' : `${market} Market`} />
            <ErrorBoundary description="Error in the market page, please try reloading">
                {
                    needCountdown && <VStack
                        borderBottomRightRadius="md"
                        borderBottomLeftRadius="md"
                        bgColor="secondaryTextColor"
                        transform="translateY(-2px)"
                        position={{ base: 'relative', md: 'absolute' }}
                        alignItems="center"
                        justify="center"
                        spacing="0"
                        py="1"
                        px="4"
                    >
                        <Text fontSize="16px" fontWeight="bold" color="white">
                            Daily borrow limit resets in
                        </Text>
                        <Text fontSize="16px" fontWeight="bold" color="white">
                            <DailyLimitCountdown />
                        </Text>
                    </VStack>
                }
                {
                    !f2market || !market ? <Text mt="8">
                        {!f2market ? 'Loading...' : 'Market not found!'}
                    </Text>
                        : <F2Context market={f2market}>
                            <FirstTimeModal />
                            <DbrV1IssueModal />
                            <VStack
                                pt="4"
                                w='full'
                                maxW={'84rem'}
                                transitionProperty="width"
                                transition="ease-in-out"
                                transitionDuration="200ms"
                                alignItems="center"
                                px={{ base: '2', lg: '8' }}
                                spacing={{ base: '4', md: '5' }}
                            >
                                <VStack alignItems="flex-start" w='full' spacing="3">
                                    <HStack w='full' justify="space-between">
                                        <HStack transition="color ease-in-out 200ms" _hover={{ color: 'mainTextColor' }} color="secondaryTextColor" cursor="pointer" spacing="2" onClick={() => backToMarkets()}>
                                            <ArrowBackIcon fontSize="18px" _hover={{ color: 'inherit' }} color="inherit" />
                                            <Text _hover={{ color: 'inherit' }} color="inherit">Back to Markets</Text>
                                        </HStack>
                                    </HStack>
                                    {
                                        f2market.isPhasingOut && <InfoMessage
                                            alertProps={{ w: 'full' }}
                                            title="This market is being phased out"
                                            description={!!f2market.phasingOutComment && <VStack spacing="0" alignItems="flex-start" w='full'>
                                                <Text>{f2market.phasingOutComment}</Text>
                                                <Link isExternal={true} target="_blank" textDecoration="underline" href={f2market.phasingOutLink}>
                                                    Read corresponding Governance proposal
                                                </Link>
                                            </VStack>}
                                        />
                                    }
                                    <MarketBar
                                        w='full'
                                        minH="64px"
                                        overflow="hidden"
                                        alignItems="center"
                                        pt='0'
                                    />
                                </VStack>
                                {
                                    !f2market ?
                                        <Text>Market not found</Text>
                                        :
                                        <VStack
                                            alignItems="center"
                                            w='full'
                                            direction={{ base: 'column', lg: 'row' }}
                                            spacing="6"
                                        >
                                            <ErrorBoundary>
                                                <InvInconsistentFirmDelegation />
                                            </ErrorBoundary>
                                            {
                                                isMultisig && <WarningMessage
                                                    alertProps={{ w: 'full' }}
                                                    title="Using a Multisig:"
                                                    description="Please note that borrowing is not allowed for multisigs / contracts."
                                                />
                                            }
                                            <ErrorBoundary description="Error in the form component, please try reloading">
                                                {
                                                    f2market.isInv && <Container
                                                        noPadding
                                                        p="0"
                                                        label="About INV staking and DBR streaming"
                                                        description="Learn more in our documentation"
                                                        href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr"
                                                        collapsable={true}
                                                        defaultCollapse={false}
                                                    >
                                                        <InfoMessage
                                                            description={
                                                                <VStack alignItems="flex-start">
                                                                    <Text>✨ <b>{shortenNumber(f2market.extraApy, 2)}% DBR Rewards Annual Percentage Rate</b>. Real yield that you claim. Currently streaming <b>{preciseCommify(f2market.dbrYearlyRewardRate, 0)}</b> DBR's per year to INV stakers.</Text>
                                                                    <Text>✨ <b>{shortenNumber(f2market.supplyApy, 2)}% INV Staking rewards</b>. Dilution protection. Your staked INV balance increases automatically.</Text>
                                                                    <Text>
                                                                        The more DOLA that is borrowed means more DBR is burned. As DBR is burned, more DBR's are streamed to INV stakers, who benefit directly from FiRM's success.
                                                                    </Text>
                                                                </VStack>
                                                            }
                                                        />
                                                    </Container>
                                                }
                                                {
                                                    (f2market.hasClaimableRewards) && <FirmRewardWrapper market={f2market} />
                                                }
                                                <F2CombinedForm />
                                            </ErrorBoundary>
                                            {
                                                (f2market.isGovTokenCollateral) && <FirmGovToken />
                                            }
                                            {
                                                (f2market.hasClaimableRewards && f2market.name === 'cvxCRV') && <CvxCrvPreferences />
                                            }
                                            <FirmInsuranceCover />
                                            <ErrorBoundary description="The portfolio value chart could not load">
                                                <WorthEvoChartWrapper market={f2market} />
                                            </ErrorBoundary>                                            
                                        </VStack>
                                }
                                <FirmFAQ collapsable={true} defaultCollapse={false} />
                            </VStack>
                        </F2Context>
                }
            </ErrorBoundary>
        </Layout>
    )
}

export default F2MarketPage

// static with revalidate as on-chain proposal content cannot change but the status/votes can
export async function getStaticProps(context) {
    const { market } = context.params;

    return {
        props: { market: market },
    }
}

export async function getStaticPaths() {
    if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
        return { paths: [], fallback: true }
    }
    return {
        paths: F2_MARKETS.map(m => `/firm/${m.name}`),
        fallback: true,
    }
}
