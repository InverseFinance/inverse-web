import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyFrontierTabs, TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { LiquidationsTable } from '@app/components/Transparency/LiquidationsTable'

export const LiquidationsPage = () => {

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Liquidations</title>
                <meta name="og:title" content="Inverse Finance - Transparency Liquidations" />
                <meta name="og:description" content="Transparency: Liquidations" />
                <meta name="og:image" content="https://inverse.finance/assets/transparency-portal.png" />
                <meta name="description" content="Transparency: Liquidations" />
                <meta name="keywords" content="Inverse Finance, transparency, liquidations" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="Frontier (deprecated)" hideAnnouncement={true} />
            <TransparencyFrontierTabs active="frontier-liquidations" />
            <LiquidationsTable />
        </Layout>
    )
}

export default LiquidationsPage
