import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { BondsView } from '@app/components/Bonds/BondsView';

export const BondsPage = () => {
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - INV</title>
            </Head>
            <AppNav active="INV" />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="900px">
                <Flex w={{ base: 'full' }} justify="space-around" direction={{ base: 'column', md: 'row' }}>
                    <Flex w={{ base: 'full' }} pr="5">
                        <Flex w='full' spacing="2" alignItems="flex-start">
                            <BondsView />
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Layout>
    )
}

export default BondsPage
