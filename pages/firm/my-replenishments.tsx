import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { MyDbrReplenishments } from '@app/components/F2/liquidations/dbr-replenishments';
import { useAccount } from '@app/hooks/misc';
import { ShrinkableInfoMessage } from '@app/components/common/Messages';

export const MyReplenishmentsPage = () => {
    const account = useAccount();
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Transparency DBR</title>
                <meta name="og:title" content="Inverse Finance - Transparency" />
                <meta name="og:description" content="DBR Transparency" />
                <meta name="description" content="DBR Transparency" />
                <meta name="keywords" content="Inverse Finance, dao, transparency, dbr, dola, supply" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="DBR & FiRM" hideAnnouncement={true} />
            <Flex overflow="hidden" w="full" justify="space-between" direction={{ base: 'column', xl: 'row' }} ml={{ base: '0', xl: '2' }} maxW='1300px'>
                {account ? <MyDbrReplenishments account={account} /> : <ShrinkableInfoMessage message="Please connect your wallet" />}
            </Flex>
        </Layout>
    )
}

export default MyReplenishmentsPage
