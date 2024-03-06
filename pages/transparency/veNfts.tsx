import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { VeNftEvolutionWrapper } from '@app/components/Transparency/VeNftEvolution'

export const F2UsersPage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - VeNfts</title>
            </Head>
            <AppNav active="Transparency" activeSubmenu="FiRM users" hideAnnouncement={true} />
            <TransparencyTabs active="firm-users" />
            <ErrorBoundary>
                <VeNftEvolutionWrapper />
            </ErrorBoundary>
        </Layout>
    )
}

export default F2UsersPage
