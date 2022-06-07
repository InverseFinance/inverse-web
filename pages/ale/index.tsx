import { Checkbox, Flex, Text, VStack } from '@chakra-ui/react'

import { SubmitButton } from '@app/components/common/Button'
import Container from '@app/components/common/Container'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { createAlePosition } from '@app/util/ale'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { AssetInput } from '@app/components/common/Assets/AssetInput'
import { useMarkets } from '@app/hooks/useMarkets'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useBalances } from '@app/hooks/useBalances'
import { Market, Token } from '@app/types'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { InfoMessage } from '@app/components/common/Messages'
import { shortenNumber } from '@app/util/markets'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import { BoostInfos } from '@app/components/Ale/BoostInfos'

const { TOKENS, DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const Ale = () => {
    const { library } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();

    const dolaMarket = markets?.find(m => m.underlying.symbol === 'DOLA');

    const swapOptions = markets?.filter(m => m.mintable && !m.underlying.isInPausedSection && !m.collateralGuardianPaused)?.map(m => m.underlying.address);

    const { balances } = useBalances(swapOptions);

    const [inputAmount, setInputAmount] = useState('100')
    const [collateralAmount, setCollateralAmount] = useState('')
    const [borrowAmount, setBorrowAmount] = useState('')

    const [inputToken, setInputToken] = useState<Token>(dolaToken)
    const [collateralMarket, setCollateralMarket] = useState<Market>({})
    const [borrowMarket, setBorrowMarket] = useState('')

    const [isBoostDifferent, setIsBoostDifferent] = useState(false);
    const [leverageLevel, setLeverageLevel] = useState(2);
    const [isNotDefaultCollateral, setIsNotDefaultCollateral] = useState(false);

    const commonAssetInputProps = { tokens: TOKENS, balances, showBalance: true }

    useEffect(() => {
        const marketFound = markets?.find(m => m.underlying.symbol === inputToken.symbol);
        const yieldBearingMarkets = markets?.filter(m => m.underlying.symbol.replace(/^(yvcrv|yv|st)/ig, '').toLowerCase() === inputToken.symbol.replace('-3POOL', '').toLowerCase());
        yieldBearingMarkets.sort((a, b) => b.supplyApy - a.supplyApy);
        if (yieldBearingMarkets.length === 0 && !marketFound) { return };
        setCollateralMarket((yieldBearingMarkets.length > 0 && yieldBearingMarkets[0]) || marketFound);
    }, [inputToken, markets]);

    const changeCollateral = (newToken: Token) => {
        setIsNotDefaultCollateral(true);
        setCollateralMarket(markets?.find(m => m.underlying.symbol === newToken.symbol))
    }

    const changeInputToken = (newToken: Token) => {
        setIsNotDefaultCollateral(false);
        setInputToken(newToken);
    }

    const handleCreate = () => {
        return createAlePosition({
            borrowMarket: 'dola',
            collateralMarket: 'b',
            signer: library?.getSigner()
        });
    }

    const isInputDifferentThanCollateral = inputToken?.symbol !== collateralMarket?.underlying?.symbol;

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - ALE</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Ale" />
            <ErrorBoundary>
                <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                    {
                        markets?.length > 0 ?
                            <Container
                                label="Boost"
                            >
                                <VStack w='full' alignItems="flex-start" spacing="5">
                                    <Text>
                                        <AnimatedInfoTooltip mr="4" message="The deposited asset can be zapped into another one that is already yield-bearing for example DAI can be zapped to yvDAI which will then be boosted" />
                                        Deposit Asset
                                    </Text>
                                    <AssetInput
                                        amount={inputAmount}
                                        token={inputToken}
                                        assetOptions={swapOptions}
                                        onAssetChange={(newToken) => changeInputToken(newToken)}
                                        onAmountChange={(newAmount) => setInputAmount(newAmount)}
                                        orderByBalance={true}
                                        {...commonAssetInputProps}
                                    />
                                    <InfoMessage
                                        alertProps={{ w: 'full' }}
                                        description={
                                            <Text>{isNotDefaultCollateral || !isInputDifferentThanCollateral ? 'Asset' : `Highest Yield-Bearing asset alternative to ${inputToken.symbol} found`} to Boost: <b>{collateralMarket?.underlying?.symbol}</b> ({shortenNumber(collateralMarket.supplyApy)}% APY)</Text>
                                        } />
                                    <Checkbox value="true" isChecked={isBoostDifferent} onChange={() => setIsBoostDifferent(!isBoostDifferent)}>
                                        I want to boost something different
                                    </Checkbox>
                                    {
                                        isBoostDifferent && <>
                                            <Text>
                                                <AnimatedInfoTooltip mr="4" message="The asset that will be boosted thanks to borrowing DOLA and making a supply / borrow loop" />
                                                Asset to Boost
                                            </Text>
                                            <AssetInput
                                                amount={inputAmount}
                                                token={collateralMarket?.underlying}
                                                assetOptions={swapOptions}
                                                onAssetChange={(newToken) => changeCollateral(newToken)}
                                                onAmountChange={(newAmount) => setInputAmount(newAmount)}
                                                {...commonAssetInputProps}
                                            />
                                        </>
                                    }
                                    <BoostInfos
                                        inputToken={inputToken}
                                        collateralMarket={collateralMarket}
                                        borrowedMarket={dolaMarket!}
                                        inputAmount={inputAmount}
                                        onLeverageChange={(v) => setLeverageLevel(v)}
                                    />
                                    <SubmitButton onClick={handleCreate}>Create Position</SubmitButton>
                                </VStack>
                            </Container>
                            : <SkeletonBlob />
                    }
                </Flex>
            </ErrorBoundary>
        </Layout>
    )
}

export default Ale
