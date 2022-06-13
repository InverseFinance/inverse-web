import { Checkbox, Flex, HStack, Text, VStack } from '@chakra-ui/react'

import { SubmitButton } from '@app/components/common/Button'
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
import { useBalances } from '@app/hooks/useBalances'
import { Market, Token } from '@app/types'

import { SkeletonBlob } from '@app/components/common/Skeleton'

import { PlusSquareIcon } from '@chakra-ui/icons'

import { getToken } from '@app/variables/tokens'

const { TOKENS, DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const DebtRepayerPage = () => {
    const { library } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();
    const weth = getToken(TOKENS, 'WETH')!;

    const v1markets = markets?.filter(m => m.underlying.symbol.toLowerCase().endsWith('-v1'));

    const swapOptions = v1markets?.map(m => (m.underlying.address || weth.address));

    const { balances } = useBalances(swapOptions);

    const [outputAmount, setOutputAmount] = useState('')
    const [collateralAmount, setCollateralAmount] = useState('')

    const [outputToken, setOutputToken] = useState<Token>(dolaToken)
    const [collateralMarket, setCollateralMarket] = useState<Market>({})

    const commonAssetInputProps = { tokens: TOKENS, balances, showBalance: true }

    useEffect(() => {
        if(!collateralMarket?.underlying) { return };
        setOutputToken(collateralMarket.underlying.address ? collateralMarket.underlying : weth);
    }, [collateralMarket])

    const changeCollateral = (v: Market) => {
        setCollateralMarket(v);
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
                        markets?.length > 0 ?
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

                                    <HStack w='full' justify="center">
                                        <SubmitButton fontSize="20px" themeColor="green.500" maxW="fit-content" h="60px" onClick={handleCreate}>
                                            <PlusSquareIcon mr="2" /> Create a new Boosted Position
                                        </SubmitButton>
                                    </HStack>

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
