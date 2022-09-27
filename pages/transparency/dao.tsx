import { Flex, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { Delegate, Payroll, ProposalStatus, Vester } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useCompensations } from '@app/hooks/useDAO'
import { useTopDelegates } from '@app/hooks/useDelegates'
import { namedAddress, namedRoles } from '@app/util';
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { usePricesV2 } from '@app/hooks/usePrices'
import { Fund } from '@app/components/Transparency/Funds'
import { useProposals } from '@app/hooks/useProposals'
import { ProposalBarChart } from '@app/components/Transparency/fed/ProposalBarChart'
import { DaoOperationsTable } from '@app/components/Transparency/DaoOperations'

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

export const GovTransparency = () => {
    const { currentPayrolls, currentVesters } = useCompensations();
    const { prices } = usePricesV2();
    const { delegates } = useTopDelegates();
    const { proposals } = useProposals();

    const teamPower = delegates.filter(d => hasPayrollOrVester(currentPayrolls, currentVesters, d)).reduce((prev, curr) => {
        return prev + curr.votingPower
    }, 0);

    const nonTeamPower = delegates.filter(d => !hasPayrollOrVester(currentPayrolls, currentVesters, d)).reduce((prev, curr) => {
        return prev + curr.votingPower
    }, 0);

    const teamPerc = teamPower / (teamPower + nonTeamPower) * 100
    const otherPerc = nonTeamPower / (teamPower + nonTeamPower) * 100
    const totalDolaMonthly = currentPayrolls.reduce((prev, curr) => prev + curr.amount / 12, 0);
    const totalVested = currentVesters.reduce((prev, curr) => prev + curr.amount / 12, 0);

    const votingPowerDist = [
        { label: `Active Contributors`, balance: teamPower, perc: teamPerc, usdPrice: 1 },
        { label: `Others`, balance: nonTeamPower, perc: otherPerc, usdPrice: 1 },
    ];

    const payrollsWithRoles = currentPayrolls.map(p => {
        return { role: namedRoles(p.recipient), label: namedAddress(p.recipient), balance: p.amount / 12, usdPrice: 1 }
    })

    const roleCosts = Object.entries(payrollsWithRoles.reduce((prev, curr) => {
        return { ...prev, [curr.role]: curr.balance + (prev[curr.role] || 0) }
    }, {})).map(([key, v]) => {
        return {
            label: key,
            balance: v,
            perc: v / totalDolaMonthly * 100,
            usdPrice: prices && prices['dola-usd'] ? prices['dola-usd'].usd : 1,
            drill: payrollsWithRoles.filter(p => p.role === key),
        }
    }) as Fund[];

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

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Dao Transparency</title>
                <meta name="og:title" content="Inverse Finance - DAO Transparency" />
                <meta name="og:description" content="DAO Transparency" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-dao.png" />
                <meta name="description" content="DAO Transparency" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, delegates, proposals" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="DAO" />
            <TransparencyTabs active="dao" />
            <Stack spacing="8" w="full" alignItems="center" justify="center" justifyContent="center" direction='column'>
                <Flex direction="column" py="2" px="5" maxWidth="900px" w='full'>
                    <Stack spacing="5" direction='column' w="full" justify="space-around">
                        <SimpleGrid minChildWidth={{ base: '300px', sm: '300px' }} spacingX="100px" spacingY="40px">
                            <FundsDetails
                                title="Voting Power Distribution"
                                funds={votingPowerDist}
                                type="balance"
                                prices={{}}
                                labelWithPercInChart={true}
                            />
                            <VStack w='full' justify="flex-start" alignItems="flex-start">
                                <Text textAlign="left" mt="1" color="accentTextColor" fontSize="20px" fontWeight="extrabold">
                                    Created Proposals Last 12 months:
                                </Text>
                                <ProposalBarChart maxChartWidth={450} chartData={chartData} />
                            </VStack>
                            <FundsDetails
                                title="DOLA Monthly costs"
                                funds={roleCosts}
                                type="balance"
                                prices={{}}
                                labelWithPercInChart={false}
                            />
                            <FundsDetails
                                title="INV Granted (2 years linear vesting)"
                                funds={vestersByRole}
                                type="balance"
                                prices={{}}
                                labelWithPercInChart={false}
                                showAsAmountOnly={true}
                                totalLabel="- TOTAL:"
                            />
                        </SimpleGrid>
                    </Stack>
                </Flex>
                <DaoOperationsTable />
            </Stack>
        </Layout>
    )
}

export default GovTransparency
