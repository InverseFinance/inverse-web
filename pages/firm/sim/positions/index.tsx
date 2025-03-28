import { Flex, VStack, Text } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { FirmMarketsAndPositions } from '@app/components/F2/FirmMarketsAndPositions'

export const F2PositionsPage = () => {
    const router = useRouter();
    const { vnetPublicId, vnetTitle } = router.query;

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM Positions</title>
            </Head>
            <AppNav active="Markets" activeSubmenu="Liquidate Loans" hideAnnouncement={true} />
            <Flex
                bgColor={'announcementBarBackgroundColor'}
                background={"containerContentBackground"}
                borderWidth={1}
                borderTop="none"
                borderColor="navBarBorderColor"
                // bgImage="/matrix.gif"
                // borderBottom={"navBarBorderColor"}
                w="full"
                p={1}
                h="60px"
                fontSize="lg"
                justify="center"
                textAlign="center"
                alignItems="center"
                fontWeight="semibold"
                color={'mainTextColor'}
                cursor="pointer"
            >
                <Text overflow="hidden" textOverflow="ellipsis" textAlign="left" whiteSpace="nowrap" fontWeight="extrabold" color="accentTextColor">{vnetTitle || 'Simulation Mode: '+vnetPublicId}</Text>
            </Flex>
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    {
                        !!vnetPublicId && <FirmMarketsAndPositions defaultTab="Positions" vnetPublicId={vnetPublicId as string} />
                    }
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PositionsPage
