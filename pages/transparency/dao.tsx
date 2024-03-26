import { Flex, SimpleGrid, Stack, Text, VStack, useMediaQuery } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { Delegate, NetworkIds, Payroll, ProposalStatus, Vester } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useCompensations, useDAO } from '@app/hooks/useDAO'
import { useTopDelegates } from '@app/hooks/useDelegates'
import { namedAddress, namedRoles } from '@app/util';
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { usePrices, usePricesV2 } from '@app/hooks/usePrices'
import { Fund, Funds } from '@app/components/Transparency/Funds'
import { useProposals } from '@app/hooks/useProposals'
import { ProposalBarChart } from '@app/components/Transparency/fed/ProposalBarChart'
import { DaoOperationsTable } from '@app/components/Transparency/DaoOperations'
import { PayrollDetails } from '@app/components/Transparency/PayrollDetails'
import { useMarkets } from '@app/hooks/useMarkets'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { getNetworkConfigConstants } from '@app/util/networks'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { SupplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import { RTOKEN_CG_ID, RTOKEN_SYMBOL } from '@app/variables/tokens'
import { preciseCommify } from '@app/util/misc'
import { MultisigsDiagram } from '@app/components/Transparency/MultisigsDiagram'
import Container from '@app/components/common/Container'

const hasPayrollOrVester = (
    payrolls: Payroll[],
    vesters: Vester[],
    delegate: Delegate,
) => {
    const lcAddress = delegate.address.toLowerCase();
    return !!payrolls.find(p => p.recipient?.toLowerCase() === lcAddress)
        || !!vesters.find(v => v.address.toLowerCase() === lcAddress || delegate.delegators.find(_d => _d.toLowerCase() === v.address.toLowerCase()));
}

const getProposalStatusType = (status: ProposalStatus) => {
    if ([ProposalStatus.expired, ProposalStatus.defeated, ProposalStatus.canceled].includes(status)) {
        return 'Failed';
    } else if ([ProposalStatus.executed, ProposalStatus.queued, ProposalStatus.succeeded].includes(status)) {
        return 'Passed';
    }
    return 'Active'
}

const FounderAddresses = ['0x16EC2AeA80863C1FB4e13440778D0c9967fC51cb', '0x3FcB35a1CbFB6007f9BC638D388958Bc4550cB28'];

const { INV, XINV, TOKENS } = getNetworkConfigConstants(NetworkIds.mainnet);

export const GovTransparency = () => {
    const { currentPayrolls, currentVesters, currentInvBalances, isLoading } = useCompensations();
    const { prices } = usePricesV2();
    const { delegates } = useTopDelegates();
    const { proposals } = useProposals();
    const { prices: geckoPrices } = usePrices()
    const { markets, isLoading: isLoadingFrontier } = useMarkets()
    const { markets: dbrMarkets, isLoading: isLoadingFirm } = useDBRMarkets();
    const isLoadingStaking = isLoadingFrontier || isLoadingFirm;
    const { invTotalSupply, invSupplies, isLoading: isLoadingSupplies } = useDAO();
    const [isLargerThan, isLargerThan2xl] = useMediaQuery([
        "(min-width: 450px)",
        "(min-width: 96em)",
    ]);

    // Frontier staking (includes staked via FiRM)
    const invFrontierMarket = markets?.find(market => market.token === XINV);
    const stakedOnFrontier = invFrontierMarket?.supplied || 0;
    const stakedViaFirm = dbrMarkets?.find(market => market.isInv)?.invStakedViaDistributor || 0;
    const stakedViaFrontier = stakedOnFrontier - stakedViaFirm;
    const notStaked = invTotalSupply ?
        invTotalSupply - stakedOnFrontier : 0

    const rewardsPerMonth = invFrontierMarket?.rewardsPerMonth || 0;

    const teamPower = delegates.filter(d => hasPayrollOrVester(currentPayrolls, currentVesters, d))
        .filter(d => !FounderAddresses.includes(d.address))
        .reduce((prev, curr) => {
            return prev + curr.votingPower
        }, 0);

    const founderPower = delegates
        .filter(d => FounderAddresses.includes(d.address))
        .reduce((prev, curr) => {
            return prev + curr.votingPower
        }, 0);

    const nonTeamPower = delegates.filter(d => !hasPayrollOrVester(currentPayrolls, currentVesters, d))
        .filter(d => !FounderAddresses.includes(d.address))
        .reduce((prev, curr) => {
            return prev + curr.votingPower
        }, 0);

    const totalPower = founderPower + nonTeamPower + teamPower;
    const totalVested = currentVesters.reduce((prev, curr) => prev + curr.amount / 12, 0);

    // excludes external delegation power
    const founderInherentPower = currentInvBalances.filter(d => FounderAddresses.includes(d.address)).reduce((prev, curr) => prev + curr.totalInvBalance, 0);
    const teamInherentPower = currentInvBalances.filter(d => !FounderAddresses.includes(d.address)).reduce((prev, curr) => prev + curr.totalInvBalance, 0);
    const notFromInherentTeamPower = totalPower - teamInherentPower - founderInherentPower;
    const delegatedExternally = founderPower + teamPower - teamInherentPower - founderInherentPower;
    const nonTeamPowerToUse = notFromInherentTeamPower - delegatedExternally;

    const votingPowerDist = [
        { label: `Founder`, balance: founderInherentPower, perc: founderInherentPower / totalPower * 100, usdPrice: 1 },
        { label: `Active Contributors`, balance: teamInherentPower, perc: teamInherentPower / totalPower * 100, usdPrice: 1 },
        { label: `Delegated to Team / Founder`, balance: delegatedExternally, perc: delegatedExternally / totalPower * 100, usdPrice: 1 },
        { label: `Others`, balance: nonTeamPowerToUse, perc: nonTeamPowerToUse / totalPower * 100, usdPrice: 1 },
    ];

    const vestersByRecipients = Object.entries(currentVesters.reduce((prev, curr) => {
        return { ...prev, [curr.recipient]: curr.amount + (prev[curr.recipient] || 0) }
    }, {})).map(([key, v]) => {
        return {
            label: namedAddress(key),
            balance: v,
            perc: v / totalVested * 100,
            usdPrice: prices && prices['inverse-finance'] ? prices['inverse-finance'].usd : 1,
            recipient: key,
            role: namedRoles(key),
        }
    }) as Fund[];

    const vestersByRole = Object.entries(currentVesters.reduce((prev, curr) => {
        const role = namedRoles(curr.recipient);
        return { ...prev, [role]: curr.amount + (prev[role] || 0) }
    }, {})).map(([key, v]) => {
        return {
            label: key,
            balance: v,
            perc: v / totalVested * 100,
            usdPrice: prices && prices['inverse-finance'] ? prices['inverse-finance'].usd : 1,
            drill: vestersByRecipients.filter(v => v.role === key),
        }
    }) as Fund[];

    const chartData = [...proposals.sort((a, b) => a.startTimestamp - b.startTimestamp)
        .map(p => {
            const date = new Date(p.startTimestamp);
            return {
                x: p.startTimestamp,
                type: getProposalStatusType(p.status),
                month: date.getUTCMonth(),
                year: date.getUTCFullYear(),
            }
        })];

    const mainFontSize = { base: '16px', sm: '20px', md: '26px' };
    const dashboardCardTitleProps = { w: 'fit-content', position: 'static', fontSize: mainFontSize, fontWeight: 'extrabold' };
    const dashboardCardProps = { direction: 'column', mx: '0', w: { base: '100vw', lg: '600px' }, borderRadius: { base: '0', sm: '8' } };

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Dao Transparency</title>
                <meta name="og:title" content="Inverse Finance - INV & DAO Transparency" />
                <meta name="og:description" content="INV & DAO Transparency" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
                <meta name="description" content="INV & DAO Transparency" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, delegates, proposals" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="INV & DAO" hideAnnouncement={true} />
            <TransparencyTabs active="dao" />
            <VStack maxW='1400px' spacing='8'>
                <Container
                    noPadding
                    p="0"
                    label="DAO voting & INV"
                    description="INV holders and stakers govern the DAO - learn more"
                    href={'https://docs.inverse.finance/inverse-finance/inverse-finance/introduction/governance'}
                    contentProps={{ maxW: '94vw' }}
                >
                    <VStack spacing="8" w="full" alignItems="flex-start" justify="space-between">
                        <SimpleGrid columns={{ base: 1, xl: 2 }} justifyContent="center" alignContent="center" spacingX="50px" spacingY="40px" w='full'>
                            <VStack w='full'>
                                <FundsDetails
                                    title="Voting Power Distribution"
                                    totalLabel="Total Distribution:"
                                    funds={votingPowerDist}
                                    isLoading={isLoading}
                                    type="balance"
                                    prices={{}}
                                    labelWithPercInChart={true}
                                    showAsAmountOnly={true}
                                    useRecharts={true}
                                    maxW='400px'
                                    chartMode={isLargerThan}
                                />
                            </VStack>
                            <VStack w='full' justify="flex-start" alignItems="center">
                                <Text textAlign="center" mt="1" color="accentTextColor" fontSize="20px" fontWeight="extrabold">
                                    DAO Proposals (12 month):
                                </Text>
                                <ProposalBarChart maxChartWidth={isLargerThan ? 450 : 320} chartData={chartData} />
                            </VStack>
                            <VStack w='full'>
                                <PayrollDetails title="DOLA monthly payrolls" chartMode={isLargerThan} maxW='400px' isLoading={isLoading} currentPayrolls={currentPayrolls} prices={prices} useRecharts={true} />
                            </VStack>
                            <VStack w='full'>
                                <PayrollDetails title="Unclaimed payrolls" chartMode={isLargerThan} maxW='400px' isLoading={isLoading} currentPayrolls={currentPayrolls} fundKey={'unclaimed'}  prices={prices} useRecharts={true} />
                            </VStack>
                            <VStack w='full'>
                                <FundsDetails
                                    title="INV Granted (xInv scaled, 2y vesting)"
                                    funds={vestersByRole}
                                    type="balance"
                                    prices={{}}
                                    labelWithPercInChart={false}
                                    showAsAmountOnly={true}
                                    isLoading={isLoading}
                                    totalLabel="- TOTAL:"
                                    useRecharts={true}
                                    maxW='400px'
                                    chartMode={isLargerThan}
                                />
                            </VStack>
                        </SimpleGrid>
                        <Stack alignItems="flex-start" spacing={4} direction={{ base: 'column', lg: 'row' }} pt="4" px={{ base: '4', xl: '0' }} w='full'>
                            <SupplyInfos isLoading={isLoadingSupplies} token={TOKENS[INV]} supplies={invSupplies} />
                            <ShrinkableInfoMessage
                                description={
                                    isLoadingStaking ?
                                        <SkeletonBlob /> :
                                        <>
                                            <Text fontWeight="bold">{RTOKEN_SYMBOL} staking:</Text>
                                            <Funds noImage={true} showTotal={false} showPerc={true} useRecharts={true} funds={
                                                [
                                                    {
                                                        label: 'Total staked',
                                                        balance: stakedOnFrontier,
                                                        usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                                                    },
                                                    {
                                                        label: 'Not staked',
                                                        balance: notStaked,
                                                        usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                                                    }
                                                ]
                                            }
                                            />
                                            <Text fontWeight="bold">{RTOKEN_SYMBOL} staking repartition:</Text>
                                            <Funds noImage={true} showTotal={false} showPerc={true} funds={
                                                [
                                                    {
                                                        label: 'Staked via FiRM',
                                                        balance: stakedViaFirm,
                                                        usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                                                    },
                                                    {
                                                        label: 'Staked via Frontier',
                                                        balance: stakedViaFrontier,
                                                        usdPrice: geckoPrices[RTOKEN_CG_ID]?.usd!,
                                                    },
                                                ]
                                            }
                                            />
                                            <Text fontWeight="bold">Monthly distribution to stakers:</Text>
                                            <Text>{preciseCommify(rewardsPerMonth, 0)} {RTOKEN_SYMBOL} (~{preciseCommify(rewardsPerMonth * geckoPrices[RTOKEN_CG_ID]?.usd, 0, true)})</Text>
                                        </>
                                }
                            />
                            <ShrinkableInfoMessage
                                title="⚡ Roles & Powers"
                                description={
                                    <>
                                        <Flex direction="row" w='full' justify="space-between">
                                            <Text fontWeight="bold">- x{RTOKEN_SYMBOL} Admin:</Text>
                                            <Text>Change {RTOKEN_SYMBOL} APY</Text>
                                        </Flex>
                                        <Flex direction="row" w='full' justify="space-between">
                                            <Text fontWeight="bold">- Escrow Admin:</Text>
                                            <Text>Change x{RTOKEN_SYMBOL} escrow duration</Text>
                                        </Flex>
                                        <Flex direction="row" w='full' justify="space-between">
                                            <Text fontWeight="bold">- Policy Committee:</Text>
                                            <Text>Handle Reward Rates Policies</Text>
                                        </Flex>
                                    </>
                                }
                            />
                        </Stack>
                    </VStack>
                </Container>
                <Container
                    noPadding
                    p="0"
                    label="Multisigs"
                    description="Learn about the Working Groups"
                    href={'https://docs.inverse.finance/inverse-finance/inverse-finance/introduction/organization#working-groups'}
                    contentProps={{ maxW: '94vw' }}
                >
                    <MultisigsDiagram />
                </Container>
                {
                    isLargerThan2xl && <DaoOperationsTable />
                }
            </VStack>
        </Layout>
    )
}

export default GovTransparency
