import { Flex, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import Link from '@app/components/common/Link';

const LINKS = [
    { label: 'Payroll', href: '/governance/payroll' },
    { label: 'Vester', href: '/governance/vester' },
    { label: 'Yearn Fed Dashboard', href: '/transparency/yearn-fed' },
    { label: 'Tx Refunds (TWG)', href: '/governance/refunds' },
]

export const TokensPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Team Portal</title>
                <meta name="og:title" content="Inverse Finance - Team Portal" />
            </Head>
            <AppNav active="Governance" />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                <VStack alignItems="flex-start">
                    <Text fontSize="20px">
                        Team Portal
                    </Text>
                    {
                        LINKS.map(l => {
                            return <Link textDecoration="underline" href={l.href}>
                                {l.label}
                            </Link>
                        })
                    }
                </VStack>
            </Flex>
        </Layout>
    )
}

export default TokensPage