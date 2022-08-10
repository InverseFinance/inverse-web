import { VStack } from '@chakra-ui/react'

import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'

import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'

import { DebtRepayments } from '@app/components/Anchor/DebtConverter/DebtRepayments'
import { DebtRepay } from '@app/components/Anchor/DebtConverter/DebtRepay'
import { useDebtConverterOwner } from '@app/hooks/useDebtConverter'

export const DebtConverterRepaymentsPage = () => {
    const { account } = useWeb3React<Web3Provider>()
    const { owner } = useDebtConverterOwner();

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Converter Repayments</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Debt Converter" />
            <ErrorBoundary>
                <VStack maxWidth="1200px">                    
                    {
                        !!account && <DebtRepayments />
                    }
                    {
                        !!account && account === owner && <DebtRepay />
                    }
                </VStack>
            </ErrorBoundary>
        </Layout >
    )
}

export default DebtConverterRepaymentsPage
