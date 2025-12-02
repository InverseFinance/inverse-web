import { VStack } from '@chakra-ui/react'

import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'

import { useWeb3React } from '@app/util/wallet'
import { Web3Provider } from '@ethersproject/providers'

import { DebtRepayments } from '@app/components/Anchor/DebtConverter/DebtRepayments'
import { DebtRepay } from '@app/components/Anchor/DebtConverter/DebtRepay'
import { useDebtConverterOwner } from '@app/hooks/useDebtConverter'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { useState } from 'react'
import { InfoMessage } from '@app/components/common/Messages'
import Link from '@app/components/common/Link'

export const DebtConverterRepaymentsPage = () => {
    const { account } = useWeb3React<Web3Provider>()
    const { owner } = useDebtConverterOwner();
    const [isConnected, setIsConnected] = useState(true)

    useDebouncedEffect(() => {
        setIsConnected(!!account)
    }, [account], 500);

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Debt Converter Repayments</title>
            </Head>
            <AppNav active="More" activeSubmenu="Frontier - Debt Converter" />
            <ErrorBoundary>
                <VStack maxWidth="1200px">
                    {
                        isConnected && account === owner && <DebtRepay />
                    }
                    {
                        isConnected ? <DebtRepayments /> :
                            <InfoMessage alertProps={{ mt: '8' }} description="Please connect your wallet" />
                    }
                </VStack>
                <Link mt="5" href="/frontier/debt-converter">Go to Debt Converter</Link>
            </ErrorBoundary>
        </Layout >
    )
}

export default DebtConverterRepaymentsPage
