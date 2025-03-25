import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { VStack, Text, HStack, Divider, Image, Flex } from '@chakra-ui/react'
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
import { shortenNumber, smartShortNumber } from '@app/util/markets'
import { preciseCommify } from '@app/util/misc'
import { WorthEvoChartWrapper } from '@app/components/F2/WorthEvoChartContainer'
import { DbrV1IssueModal } from '@app/components/F2/Modals/DbrV1IssueIModal'
import { useMultisig } from '@app/hooks/useSafeMultisig'
import Link from '@app/components/common/Link'
import { FirmInsuranceCover } from '@app/components/common/InsuranceCover'
import { OLD_BORROW_CONTROLLER } from '@app/config/constants'
import { useAccount } from '@app/hooks/misc'

const { F2_MARKETS } = getNetworkConfigConstants();

const useDefaultPreview = ['CRV', 'cvxCRV', 'cvxFXS', 'st-yCRV']

export const F2MarketPage = ({ market }: { market: string }) => {
    const router = useRouter();
    const account = useAccount();
    const { markets } = useDBRMarkets(market);
    const f2market = markets.length > 0 && !!market ? markets[0] : undefined;
    const { isMultisig, isWhitelisted } = useMultisig(f2market?.borrowController);

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
            <AppNav hideAnnouncement={true} active={'Markets'} activeSubmenu={market?.isInv ? 'Stake INV' : `${market} Market`} />
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
                        {
                            f2market?.borrowController === OLD_BORROW_CONTROLLER ? <>
                                <Text fontSize="16px" fontWeight="bold" color="white">
                                    Daily borrow limit resets in
                                </Text>
                                <Text fontSize="16px" fontWeight="bold" color="white">
                                    <DailyLimitCountdown />
                                </Text>
                            </> : <>
                                <Text fontSize="16px" fontWeight="bold" color="white">
                                    Daily borrow limit resetting
                                </Text>
                                <Text fontSize="16px" fontWeight="bold" color="white">
                                    Ramping up to {smartShortNumber(Math.min(f2market?.dailyLimit, f2market?.dolaLiquidity), 2)}
                                </Text>
                            </>
                        }
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
                                        f2market.isPhasingOut && !f2market.noDeposit && <InfoMessage
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
                                    {
                                        f2market.noDeposit && <InfoMessage
                                            alertProps={{ w: 'full', status: 'warning' }}
                                            title={`Deposits Disabled for ${f2market.name}`}
                                            description={
                                                <VStack spacing="0" alignItems="flex-start" w='full'>                                                    
                                                    <Text>Collateral deposits are currently disabled for this market.</Text>
                                                    {
                                                        [
                                                            '0x5e5d086781Ec430E56bd4410b0Af106B86292339',
                                                            '0x52555b437EeE8F55a7897B4E1F8fB3e7Edb2b344',
                                                            '0xE58ED128325A33afD08e90187dB0640619819413',
                                                        ]
                                                        .map(a => a.toLowerCase())
                                                        .includes(account?.toLowerCase()) && <Text color="accentTextColor" fontWeight="bold">
                                                            Note: Your funds are SAFE, they were secured via liquidation by the team temporarily, and Governance will bring back your position to normal very soon.
                                                        </Text>
                                                    }
                                                    <Text>Please reach out on Discord for more information.</Text>                                                    
                                                </VStack>
                                            }
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
                                                isMultisig && !isWhitelisted && <WarningMessage
                                                    alertProps={{ w: 'full' }}
                                                    title="Using a Multisig:"
                                                    description={
                                                        <VStack spacing="0" alignItems="flex-start" w='full'>
                                                            <Text>Please note that <b>borrowing is not allowed for multisigs / contracts unless whitelisted</b>.</Text>
                                                            <Flex w='full' justify="flex-end" display="inline">
                                                                <Text display="inline"><b>Note</b>: to be whitelisted, please reach out on <Link isExternal={true} target="_blank" textDecoration="underline" href="https://discord.gg/YpYJC7R5nv">discord</Link> or the <Link textDecoration="underline" isExternal={true} target="_blank" href="https://forum.inverse.finance">forum</Link>, if you have enough INV you can also <Link textDecoration="underline" display="inline" href="/governance/propose">submit a governance proposal</Link> yourself.</Text>
                                                            </Flex>
                                                        </VStack>
                                                    }
                                                />
                                            }
                                            {
                                                f2market.isInv && <InfoMessage
                                                    alertProps={{ w: 'full' }}
                                                    description={
                                                        <VStack alignItems="flex-start">
                                                            <HStack>
                                                                <Link cursor="pointer" fontWeight="bold" color="mainTextColor" textDecoration="underline" href="/sINV">
                                                                    Looking for sINV?
                                                                </Link>
                                                                <Image src="/assets/sINVx128.png" alt="sINV" w="24px" h="24px" />
                                                            </HStack>
                                                            <Text>sINV is a new product that auto-compounds DBR rewards for more INV, it's the best INV staking option if you're not borrowing DOLA or voting on proposals.</Text>
                                                            <Link cursor="pointer" fontWeight="bold" color="mainTextColor" textDecoration="underline" href="/sINV">
                                                                Go to sINV
                                                            </Link>
                                                        </VStack>
                                                    }
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
                                                                    {
                                                                        f2market.extraApy > 0 && <Text>✨ <b>{shortenNumber(f2market.extraApy, 2)}% DBR Rewards Annual Percentage Rate</b>. Real yield that you claim. Currently streaming <b>{preciseCommify(f2market.dbrYearlyRewardRate, 0)}</b> DBR's per year to INV stakers.</Text>
                                                                    }
                                                                    {
                                                                        f2market.supplyApy > 0 && <Text>✨ <b>{shortenNumber(f2market.supplyApy, 2)}% INV Staking rewards</b>. Dilution protection. Your staked INV balance increases automatically.</Text>
                                                                    }
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
                                            {/* temporarily disabled */}
                                            {/* <ErrorBoundary description="The portfolio value chart could not load">
                                                <WorthEvoChartWrapper market={f2market} />
                                            </ErrorBoundary> */}
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
