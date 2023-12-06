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
import { PayrollDetails } from '@app/components/Transparency/PayrollDetails'

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

export const GovTransparency = () => {
    const { currentPayrolls, currentVesters, currentInvBalances, isLoading } = useCompensations();
    const { prices } = usePricesV2();
    const { delegates } = useTopDelegates();
    const { proposals } = useProposals();

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
        { label: `Externally Delegated to Contributors / Founder`, balance: delegatedExternally, perc: delegatedExternally / totalPower * 100, usdPrice: 1 },
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

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Dao Transparency</title>
                <meta name="og:title" content="Inverse Finance - DAO Transparency" />
                <meta name="og:description" content="DAO Transparency" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
                <meta name="description" content="DAO Transparency" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, delegates, proposals" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="DAO" hideAnnouncement={true} />
            <TransparencyTabs active="dao" />
            <Stack spacing="8" w="full" alignItems="center" justify="center" justifyContent="center" direction='column'>
                <Flex direction="column" py="2" px="5" maxWidth="900px" w='full'>
                    <Stack spacing="5" direction='column' w="full" justify="space-around">
                        <SimpleGrid minChildWidth={{ base: '300px', sm: '300px' }} spacingX="100px" spacingY="40px">
                            <FundsDetails
                                title="Voting Power Distribution"
                                totalLabel="Total Distribution:"
                                funds={votingPowerDist}
                                isLoading={isLoading}
                                type="balance"
                                prices={{}}
                                labelWithPercInChart={true}
                                showAsAmountOnly={true}
                            />
                            <VStack w='full' justify="flex-start" alignItems="center">
                                <Text textAlign="center" mt="1" color="accentTextColor" fontSize="20px" fontWeight="extrabold">
                                    DAO Proposals (12 month):
                                </Text>
                                <ProposalBarChart maxChartWidth={450} chartData={chartData} />
                            </VStack>
                            <PayrollDetails isLoading={isLoading} currentPayrolls={currentPayrolls} prices={prices} />
                            <FundsDetails
                                title="INV Granted (xInv scaled, 2y vesting)"
                                funds={vestersByRole}
                                type="balance"
                                prices={{}}
                                labelWithPercInChart={false}
                                showAsAmountOnly={true}
                                isLoading={isLoading}
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
