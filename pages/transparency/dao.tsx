import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { getNetworkConfigConstants } from '@app/util/networks';
import { Delegate, NetworkIds } from '@app/types'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO } from '@app/hooks/useDAO'
import { GovernanceRules } from '@app/components/Governance/GovernanceRules'
import { Breakdown, DelegatesPreview } from '@app/components/Governance'
import { useTopDelegates } from '@app/hooks/useDelegates'
import { PieChart } from '@app/components/Transparency/PieChart'
import { shortenNumber } from '@app/util/markets';
import theme from '@app/variables/theme';

const hasPayrollOrVester = (
    payrolls: { address: string, amount: number }[],
    vesterRecipients: string[],
    delegate: Delegate,
) => {
    const lcAddress = delegate.address.toLowerCase();
    return !!payrolls.find(p => p?.address?.toLowerCase() === lcAddress)
        || !!vesterRecipients.find(a => a.toLowerCase() === lcAddress || delegate.delegators.find(_d => _d.toLowerCase() === a.toLowerCase()));
}

export const GovTransparency = () => {
    const { currentPayrolls, vesterRecipients } = useDAO();
    const { delegates } = useTopDelegates();

    const teamPower = delegates.filter(d => hasPayrollOrVester(currentPayrolls, vesterRecipients, d)).reduce((prev, curr) => {
        return prev + curr.votingPower
    }, 0);

    const nonTeamPower = delegates.filter(d => !hasPayrollOrVester(currentPayrolls, vesterRecipients, d)).reduce((prev, curr) => {
        return prev + curr.votingPower
    }, 0);

    const teamPerc = teamPower / (teamPower + nonTeamPower) * 100
    const otherPerc = nonTeamPower / (teamPower + nonTeamPower) * 100

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
            <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2">
                <VStack py="2" pl="200px" minW="900px">
                    <Text fontWeight="extrabold" color="secondary" fontSize="18px">Voting Power Distribution:</Text>
                    <PieChart
                        data={[
                            { x: `Active Contributors: ${shortenNumber(teamPerc)}%`, y: teamPower, perc: teamPerc },
                            { x: `Other DAO Members: ${shortenNumber(otherPerc)}%`, y: nonTeamPower, perc: otherPerc },
                        ]}
                        colorScale={[theme.colors.containerContentBackground, theme.colors.secondary]}
                        showTotalUsd={false}
                        showAsAmountOnly={true}
                    />
                </VStack>
                <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
                    <GovernanceRules />
                    <Breakdown p="0" />
                    <DelegatesPreview p="0" />
                </VStack>
            </Flex>
        </Layout>
    )
}

export default GovTransparency
