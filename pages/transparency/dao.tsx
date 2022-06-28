import { Flex, SimpleGrid, Stack, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { Delegate, Payroll, Vester } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useCompensations } from '@app/hooks/useDAO'
import { GovernanceRules } from '@app/components/Governance/GovernanceRules'
import { Breakdown, DelegatesPreview } from '@app/components/Governance'
import { useTopDelegates } from '@app/hooks/useDelegates'
import { shortenNumber } from '@app/util/markets';
import { namedAddress, namedRoles } from '@app/util';
import { FundsDetails } from '@app/components/Transparency/FundsDetails'
import { usePricesV2 } from '@app/hooks/usePrices'

const hasPayrollOrVester = (
    payrolls: Payroll[],
    vesters: Vester[],
    delegate: Delegate,
) => {
    const lcAddress = delegate.address.toLowerCase();
    return !!payrolls.find(p => p.recipient?.toLowerCase() === lcAddress)
        || !!vesters.find(v => v.address.toLowerCase() === lcAddress || delegate.delegators.find(_d => _d.toLowerCase() === v.address.toLowerCase()));
}

export const GovTransparency = () => {
    const { currentPayrolls, currentVesters } = useCompensations();
    const { prices } = usePricesV2();
    const { delegates } = useTopDelegates();

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
        { label: `Active Contributors: ${shortenNumber(teamPerc)}%`, balance: teamPower, perc: teamPerc, usdPrice: 1 },
        { label: `Others: ${shortenNumber(otherPerc)}%`, balance: nonTeamPower, perc: otherPerc, usdPrice: 1 },
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
    });

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
    });

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
    });

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Governance</title>
                <meta name="og:title" content="Inverse Finance - Transparency DAO" />
                <meta name="og:description" content="DAO Transparency" />
                <meta name="description" content="DAO Transparency" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, delegates, proposals" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="DAO" />
            <TransparencyTabs active="dao" />
            <Stack spacing="8" w="full" justify="center" justifyContent="center" direction={{ base: 'column', xl: 'row' }}>
                <Flex direction="column" py="2" px="5" maxWidth="900px" w='full'>
                    <Stack spacing="5" direction={{ base: 'column', lg: 'column' }} w="full" justify="space-around">
                        <SimpleGrid minChildWidth={{ base: '300px', sm: '300px' }} spacingX="100px" spacingY="40px">
                            <FundsDetails
                                title="DOLA Monthly costs"
                                funds={roleCosts}
                                type="balance"
                                prices={{}}
                            />
                            <FundsDetails
                                title="INV Granted (2 years linear vesting)"
                                funds={vestersByRole}
                                type="balance"
                                prices={{}}
                            />
                            <FundsDetails
                                title="Voting Power Distribution"
                                funds={votingPowerDist}
                                type="balance"
                                prices={{}}
                            />

                        </SimpleGrid>
                    </Stack>
                </Flex>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: '350px' }}>
                    <GovernanceRules />
                    <Breakdown p="0" />
                    <DelegatesPreview p="0" />
                </VStack>
            </Stack>
        </Layout>
    )
}

export default GovTransparency
