import { Image, VStack, Text, HStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useAccount } from '@app/hooks/misc'
import { UserDashboard } from '@app/components/F2/UserDashboard'
import { useAppTheme } from '@app/hooks/useAppTheme'

const firmImages = {
    'dark': 'firm-final-logo-white.png',
    'light': 'firm-final-logo.png',
}

export const UserDashboardPage = () => {
    const account = useAccount();    
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Dashboard</title>
                <meta name="og:description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/firm-page.png" />
            </Head>
            <AppNav active="Dashboard" />
            <ErrorBoundary>
                <VStack pt="4" spacing="4" w='full' maxW={{ base: '94%', '2xl': '90rem' }}>
                    <HStack alignItems="center" justify="space-between" w='full'>
                        <Text fontWeight="extrabold" fontSize="40px">My Dashboard</Text>
                        <Image borderRadius="5px" display={{ base: 'none', sm: 'inline-block' }} w='200px' src={`/assets/inverse-logo-banner.png?`} />
                    </HStack>
                    <ErrorBoundary description="Failed to Markets">
                        <UserDashboard account={account} />
                    </ErrorBoundary>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default UserDashboardPage
