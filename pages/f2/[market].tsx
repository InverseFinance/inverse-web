import { SimmpleBreadcrumbs } from '@app/components/common/Breadcrumbs'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { Stack, VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { DbrHealth } from '@app/components/F2/DbrHealth'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { CreditLimitBar } from '@app/components/F2/CreditLimitBar'
import { F2CollateralForm } from '@app/components/F2/F2CollateralForm'
import { F2BorrowForm } from '@app/components/F2/F2BorrowForm'
import { useState } from 'react'

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2MarketPage = ({ market }: { market: string }) => {
    const [newCollateralAmount, setNewCollateralAmount] = useState(0);
    const [newDebtAmount, setNewDebtAmount] = useState(0);
    const { account, library } = useWeb3React<Web3Provider>();
    const { markets } = useDBRMarkets(market);
    const f2market = markets[0];

    return (
        <Layout>
            <AppNav active="Frontier" />
            <ErrorBoundary>
                <VStack w='full' maxW="84rem" alignItems="flex-start" p="6" spacing="8">
                    <SimmpleBreadcrumbs
                        breadcrumbs={[
                            { label: 'F2', href: '/f2' },
                            { label: `${f2market.name} Market`, href: '#' },
                        ]}
                    />
                    <Stack
                        alignItems="flex-start"
                        w='full'
                        direction={{ base: 'column', lg: 'row' }}
                        spacing="12"
                    >
                        <ErrorBoundary description="Failed to load Dbr Health">
                            <CreditLimitBar account={account} market={f2market} amountDelta={newCollateralAmount} debtDelta={newDebtAmount} />
                        </ErrorBoundary>
                        <ErrorBoundary description="Failed to load Dbr Health">
                            <DbrHealth account={account} debtDelta={newDebtAmount} />
                        </ErrorBoundary>
                    </Stack>
                    <Stack
                        alignItems="flex-start"
                        w='full'
                        direction={{ base: 'column', lg: 'row' }}
                        spacing="12"
                    >
                        <F2CollateralForm
                            signer={library?.getSigner()}
                            f2market={f2market}
                            account={account}
                            onAmountChange={(floatAmount) => setNewCollateralAmount(floatAmount)}
                        />
                        <F2BorrowForm
                            signer={library?.getSigner()}
                            f2market={f2market}
                            account={account}
                            onAmountChange={(floatAmount) => setNewDebtAmount(floatAmount)}
                        />
                    </Stack>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2MarketPage

// static with revalidate as on-chain proposal content cannot change but the status/votes can
export async function getStaticProps(context) {
    const { market } = context.params;

    return {
        props: { market: market },
    }
}

export async function getStaticPaths() {
    return {
        paths: F2_MARKETS.map(m => `/f2/${m.address}`),
        fallback: true,
    }
}
