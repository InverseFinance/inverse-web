import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { DbrSpenders } from '@app/components/F2/liquidations/dbr-spenders'

export const LiquidationsPage = () => {

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency DBR</title>
                <meta name="og:title" content="Inverse Finance - Transparency DBR" />
                <meta name="og:description" content="Transparency: DBR" />
                <meta name="description" content="Transparency: DBR" />
                <meta name="keywords" content="Inverse Finance, transparency, DBR" />
            </Head>
            <AppNav active="Learn" activeSubmenu="Transparency Portal" />
            <TransparencyTabs active="dbr" />
            <DbrSpenders />
        </Layout>
    )
}

export default LiquidationsPage
