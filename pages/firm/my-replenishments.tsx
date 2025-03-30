import { Flex, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { MyDbrReplenishments } from '@app/components/F2/liquidations/dbr-replenishments';
import { useAccount } from '@app/hooks/misc';
import { InfoMessage } from '@app/components/common/Messages';

export const MyReplenishmentsPage = () => {
    const account = useAccount();
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - My Replenishments</title>
                <meta name="og:title" content="Inverse Finance - My Replenishments" />
                <meta name="og:description" content="My Replenishments" />
                <meta name="description" content="My Replenishments" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dbr, dola, supply" />
            </Head>
            <AppNav active="Markets" activeSubmenu="My Replenishments" hideAnnouncement={true} />
            <Flex overflow="hidden" w="full" justify="space-between" direction={{ base: 'column', xl: 'row' }} ml={{ base: '0', xl: '2' }} maxW='1300px'>
                {account ? <MyDbrReplenishments account={account} /> : <VStack maxW='500px' p="6">
                    <InfoMessage description="Please connect your wallet" />
                </VStack>
                }
            </Flex>
        </Layout>
    )
}

export default MyReplenishmentsPage
