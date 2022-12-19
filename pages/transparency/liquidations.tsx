import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { LiquidationsTable } from '@app/components/Transparency/LiquidationsTable'

export const LiquidationsPage = () => {

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Liquidations</title>
                <meta name="og:title" content="Inverse Finance - Transparency Liquidations" />
                <meta name="og:description" content="Transparency: Liquidations" />
                <meta name="description" content="Transparency: Liquidations" />
                <meta name="keywords" content="Inverse Finance, transparency, liquidations" />
            </Head>
            <AppNav active="Learn" activeSubmenu="Transparency Portal" />
            <TransparencyTabs active="liquidations" />
            <LiquidationsTable />
        </Layout>
    )
}

export default LiquidationsPage
