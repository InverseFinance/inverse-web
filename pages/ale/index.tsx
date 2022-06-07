import { Checkbox, Flex, Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack } from '@chakra-ui/react'

import { NavButtons, SubmitButton } from '@app/components/common/Button'
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
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import { useAnchorPrices, usePricesV2 } from '@app/hooks/usePrices'

const { TOKENS, DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

const BoostInfos = ({
    inputToken,
    collateralMarket,
    borrowedMarket,
    leverageLevel,
    inputAmount,
}: {
    inputToken: Token,
    collateralMarket: Market,
    borrowedMarket: Market,
    leverageLevel: number,
    inputAmount: string,
}) => {
    const { prices } = usePricesV2();
    const { prices: oraclePrices } = useAnchorPrices();
    console.log(prices)

    if(!collateralMarket || !inputToken) {
        return <></>
    }

    const inputWorth = prices[inputToken.coingeckoId||inputToken.symbol] ? parseFloat(inputAmount) * prices[inputToken.coingeckoId||inputToken.symbol].usd : 0;
    const desiredWorth = inputWorth * leverageLevel;
    const collateralWorth = inputWorth * collateralMarket.collateralFactor;
    const borrowRequired = desiredWorth - collateralWorth;
    const collateralAmount = oraclePrices && oraclePrices[collateralMarket.token] ? desiredWorth / getBnToNumber(oraclePrices[collateralMarket.token], collateralMarket.underlying.decimals) : 0;

    return <VStack w='full'>
        <HStack>
            <Text>Deposit:</Text>
            <Text>
                {shortenNumber(parseFloat(inputAmount), 4)} {inputToken?.symbol} ({shortenNumber(inputWorth, 2, true, true)})
            </Text>
        </HStack>
        <HStack>
            <Text>Desired Boost:</Text>
            <Text>
                x{leverageLevel} on {collateralMarket?.underlying?.symbol}
            </Text>
        </HStack>
        <HStack>
            <Text>{collateralMarket?.underlying?.symbol}'s Borrowing Power:</Text>
            <Text>
                {collateralMarket.collateralFactor*100}% of {shortenNumber(inputWorth, 2, true)} = {shortenNumber(collateralWorth, 2, true)}
            </Text>
        </HStack>
        <HStack>
            <Text>Desired Boosted Collateral:</Text>
            <Text>
                {shortenNumber(collateralAmount, 2, false, true)} {collateralMarket?.underlying?.symbol} ({shortenNumber(desiredWorth, 2, true)})
            </Text>
        </HStack>
        <HStack>
            <Text>DOLA debt required to achieve the boost:</Text>
            <Text>
            {shortenNumber(desiredWorth, 2, true)} - {shortenNumber(collateralWorth, 2, true)} = {shortenNumber(borrowRequired, 2)}
            </Text>
        </HStack>
    </VStack>
}

export const Ale = () => {
    const { library } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();

    const dolaMarket = markets?.find(m => m.underlying.symbol === 'DOLA');

    const swapOptions = markets?.filter(m => m.mintable && !m.underlying.isInPausedSection && !m.collateralGuardianPaused)?.map(m => m.underlying.address);

    const { balances } = useBalances(swapOptions);

    const [inputAmount, setInputAmount] = useState('')
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
        const yieldBearingMarkets = markets?.filter(m => m.underlying.symbol.replace(/^(yvcrv|yv|st)/ig, '').toLowerCase() === inputToken.symbol.toLowerCase());
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

    const riskColor = leverageLevel < 4 ? 'orange' : leverageLevel < 6 ? 'tomato' : 'red.500';

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
                                    <AnimatedInfoTooltip mr="2" message="The deposited asset can be zapped into another one that is already yield-bearing for example DAI can be zapped to yvDAI which will then be boosted" />
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
                                description={
                                    <Text>{isNotDefaultCollateral || !isInputDifferentThanCollateral ? 'Asset' : 'Best Yield-Bearing asset found'} to Boost: <b>{collateralMarket?.underlying?.symbol}</b> ({shortenNumber(collateralMarket.supplyApy)}% APY)</Text>
                                } />
                                <Checkbox value="true" isChecked={isBoostDifferent} onChange={() => setIsBoostDifferent(!isBoostDifferent)}>
                                    I want to boost something different
                                </Checkbox>
                                {
                                    isBoostDifferent && <>
                                        <Text>
                                            <AnimatedInfoTooltip mr="2" message="The asset that will be boosted thanks to borrowing DOLA and making a supply / borrow loop" />
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
                                <VStack w='full'>
                                    <Flex w='full' justify="space-between" alignItems="center">
                                        <Text fontWeight="bold" color={riskColor}>Risk: {leverageLevel < 4 ? 'Medium' : leverageLevel < 6 ? 'High' : 'Very High'}</Text>
                                        <SubmitButton w="100px">Advanced</SubmitButton>
                                    </Flex>
                                    <Slider
                                        value={leverageLevel}
                                        onChange={(v: number) => setLeverageLevel(v)}
                                        min={1.5}
                                        max={9}
                                        step={0.5}
                                        aria-label='slider-ex-4'
                                        defaultValue={leverageLevel}>
                                        <SliderTrack bg='red.100'>
                                            <SliderFilledTrack bg={riskColor} />
                                        </SliderTrack>
                                        <SliderThumb />
                                    </Slider>
                                    <Flex>
                                        <Text fontWeight="bold">Boost x{leverageLevel.toFixed(1)}</Text>
                                    </Flex>
                                    <BoostInfos
                                        inputToken={inputToken}
                                        collateralMarket={collateralMarket}
                                        borrowedMarket={dolaMarket}
                                        leverageLevel={leverageLevel}
                                        inputAmount={inputAmount}

                                    />
                                </VStack>
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
