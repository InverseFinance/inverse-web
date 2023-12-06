import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { FirmLiquidations } from '@app/components/F2/liquidations/FirmLiquidations'

export const LiquidationsPage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Transparency Liquidations</title>
                <meta name="og:title" content="Inverse Finance - Transparency Liquidations" />
                <meta name="og:description" content="Transparency: Liquidations" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
                <meta name="description" content="Transparency: Liquidations" />
                <meta name="keywords" content="Inverse Finance, firm, transparency, liquidations" />
            </Head>
            <AppNav active="Transparency" activeSubmenu="Liquidations" hideAnnouncement={true} />
            <TransparencyTabs active="liquidations" />
            <FirmLiquidations />
        </Layout>
    )
}

export default LiquidationsPage
