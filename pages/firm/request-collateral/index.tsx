import { VStack, Text } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { CollateralRequestForm } from '@app/components/F2/CollateralRequest/CollateralRequestForm'
import Link from '@app/components/common/Link'
import { InfoMessage } from '@app/components/common/Messages'

export const F2PAGE = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Request Collateral</title>
                <meta name="og:title" content="Inverse Finance - Request Collateral" />
                <meta name="og:description" content="Submit a request to add a new collateral on FiRM!" />
                <meta name="description" content="Submit a request to add a new collateral on FiRM!" />
                <meta name="keywords" content="Inverse Finance, FiRM, collateral request, collateral" />
            </Head>
            <AppNav active="More" activeSubmenu="Request Collateral" />
            <ErrorBoundary>
                <VStack w='full' maxW="600px" mt="4" spacing="8">
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        description={
                            <VStack alignItems="flex-start" spacing="0">
                                <Text>
                                    Here you can submit a request to add a new collateral on FiRM
                                </Text>
                                <Text>
                                    If you need to add more details, or if the maximum of 3 requests per day is reached, you can also post on the DAO's forum or on discord in the general-growth channel.
                                </Text>
                                <Link textDecoration="underline" href="https://forum.inverse.finance/c/collateral-requests/11" isExternal>
                                    Post on the forum
                                </Link>
                                <Link textDecoration="underline" href="https://discord.gg/YpYJC7R5nv" isExternal>
                                    Post on discord
                                </Link>
                            </VStack>
                        }
                    />
                    <CollateralRequestForm />
                    <Link href="/firm/request-collateral/list" textDecoration="underline">See the list of submitted requests</Link>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE
