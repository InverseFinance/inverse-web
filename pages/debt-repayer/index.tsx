import { Checkbox, Flex, HStack, Text, VStack } from '@chakra-ui/react'

import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useEffect, useState } from 'react'

import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { AssetInput } from '@app/components/common/Assets/AssetInput'
import { useMarkets } from '@app/hooks/useMarkets'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useSuppliedBalances, useSupplyBalances } from '@app/hooks/useBalances'
import { Market, Token } from '@app/types'

import { SkeletonBlob } from '@app/components/common/Skeleton'

import { getToken } from '@app/variables/tokens'
import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { parseUnits } from '@ethersproject/units'
import { roundFloorString } from '@app/util/misc'

const { TOKENS, DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const DebtRepayerPage = () => {
    const { library } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();
    const weth = getToken(TOKENS, 'WETH')!;

    const v1markets = markets
        ?.filter(m => m.underlying.symbol.toLowerCase().endsWith('-v1'))

    const swapOptions = v1markets?.map(m => (m.token));
    const tokens = v1markets?.reduce((prev, curr) => ({ ...prev, [curr.token]: curr.underlying }), {});

    const { balances } = useSupplyBalances();
    const supplied = useSuppliedBalances();
    const { exchangeRates } = useExchangeRatesV2();

    const balancesAsUnderlying = supplied?.reduce((prev, curr) => {
        return { ...prev, [curr.token]: parseUnits(roundFloorString(curr.balance, curr.underlying.decimals), curr.underlying.decimals) }
    }, {})

    const [outputAmount, setOutputAmount] = useState('')
    const [collateralAmount, setCollateralAmount] = useState('')

    const [outputToken, setOutputToken] = useState<Token>(dolaToken)
    const [collateralMarket, setCollateralMarket] = useState<Market>({})

    const commonAssetInputProps = { tokens: tokens, balances: balancesAsUnderlying, showBalance: true }

    useEffect(() => {
        if (!v1markets.length || collateralMarket.underlying) { return };
        setCollateralMarket(v1markets[0]);
    }, [v1markets, collateralMarket])

    useEffect(() => {
        if (!collateralMarket?.underlying) { return };
        setOutputToken(collateralMarket.underlying.address ? collateralMarket.underlying : weth);
    }, [collateralMarket])

    const changeCollateral = (v: Market) => {
        changeCollateralAmount(collateralAmount);
    }

    const changeCollateralAmount = (newAmount: string) => {
        setCollateralAmount(newAmount);
        // setOutputAmount()
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Repayer</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Debt Repayer" />
            <ErrorBoundary>
                <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1200px">
                    {
                        v1markets?.length > 0 && !!collateralMarket?.underlying ?
                            <Container
                                contentProps={{ p: '8' }}
                            >
                                <VStack w='full' alignItems="flex-start" spacing="5">
                                    <AssetInput
                                        amount={collateralAmount}
                                        token={collateralMarket?.underlying}
                                        assetOptions={swapOptions}
                                        onAssetChange={(newToken) => changeCollateral(newToken)}
                                        onAmountChange={(newAmount) => changeCollateralAmount(newAmount)}
                                        {...commonAssetInputProps}
                                    />

                                    {/* <AssetInput
                                        amount={outputAmount}
                                        token={outputToken}
                                        assetOptions={swapOptions}
                                        onAssetChange={(newToken) => changeou(newToken)}
                                        onAmountChange={(newAmount) => changeCollateralAmount(newAmount)}
                                        orderByBalance={true}
                                        {...commonAssetInputProps}
                                    /> */}

                                </VStack>
                            </Container>
                            : <SkeletonBlob />
                    }
                </Flex>
            </ErrorBoundary>
        </Layout>
    )
}

export default DebtRepayerPage
