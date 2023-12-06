import { Checkbox, Flex, HStack, Text, VStack } from '@chakra-ui/react'

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
import { PlusSquareIcon } from '@chakra-ui/icons'
import { roundFloorString } from '@app/util/misc'

const { TOKENS, DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const Ale = () => {
    const { provider } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();

    const dolaMarket = markets?.find(m => m.underlying.symbol === 'DOLA');
    const invMarket = markets?.find(m => m.underlying.symbol === 'INV' && m.mintable);

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
        setCollateralMarket(markets?.find(m => m.underlying.symbol === newToken.symbol));
        changeCollateralAmount(collateralAmount);
    }

    const changeInputToken = (newToken: Token) => {
        setIsNotDefaultCollateral(false);
        setInputToken(newToken);
        changeInputAmount(inputAmount);
    }

    const changeCollateralAmount = (newAmount: string) => {
        setCollateralAmount(newAmount);
        const marketFound = markets?.find(m => m.underlying.symbol === inputToken.symbol)!;
        setInputAmount(roundFloorString(parseFloat(newAmount) * collateralMarket.oraclePrice / marketFound?.oraclePrice));
    }

    const changeInputAmount = (newAmount: string) => {
        setInputAmount(newAmount);
        const marketFound = markets?.find(m => m.underlying.symbol === inputToken.symbol)!;
        setCollateralAmount(roundFloorString(parseFloat(newAmount) * marketFound.oraclePrice / collateralMarket?.oraclePrice));
    }

    const handleCreate = () => {
        return createAlePosition({
            borrowMarket: dolaMarket!.token,
            collateralMarket: collateralMarket.token,
            inputToken: inputToken.address,
            inputAmount,
            collateralAmount,
            signer: provider?.getSigner(),
        });
    }

    const isInputDifferentThanCollateral = inputToken?.symbol !== collateralMarket?.underlying?.symbol;

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - ALE</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Ale" />
            <ErrorBoundary>
                <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1200px">
                    {
                        markets?.length > 0 ?
                            <Container                              
                                contentProps={{ p: '8' }}
                            >
                                <VStack w='full' alignItems="flex-start" spacing="5">
                                    <HStack spacing="2">
                                        <AnimatedInfoTooltip message="The asset to deposit, it can be different than the one you want to boost, by default we'll transform the asset to Yield-Bearing one when possible (Eth to stEth for example)" />
                                        <Text fontSize="20px" fontWeight="extrabold">
                                            Deposit Asset
                                        </Text>
                                    </HStack>
                                    <AssetInput
                                        amount={inputAmount}
                                        token={inputToken}
                                        assetOptions={swapOptions}
                                        onAssetChange={(newToken) => changeInputToken(newToken)}
                                        onAmountChange={(newAmount) => changeInputAmount(newAmount)}
                                        orderByBalance={true}
                                        {...commonAssetInputProps}
                                    />
                                    <InfoMessage
                                        alertProps={{ w: 'full' }}
                                        description={
                                            <Text>{isNotDefaultCollateral || !isInputDifferentThanCollateral ? 'Asset' : `Highest similar Yield-Bearing asset found`} to Boost: <b>{collateralMarket?.underlying?.symbol}</b> ({shortenNumber(collateralMarket.supplyApy)}% APY)</Text>
                                        } />
                                    <Checkbox value="true" isChecked={isBoostDifferent} onChange={() => setIsBoostDifferent(!isBoostDifferent)}>
                                        I want to boost something different
                                    </Checkbox>
                                    {
                                        isBoostDifferent && <>
                                            <HStack spacing="2">
                                                <AnimatedInfoTooltip message="The asset you wish to Boost, usually a Yield-Bearing asset" />
                                                <Text fontSize="20px" fontWeight="extrabold">Asset to Boost</Text>
                                            </HStack>
                                            <AssetInput
                                                amount={collateralAmount}
                                                token={collateralMarket?.underlying}
                                                assetOptions={swapOptions}
                                                onAssetChange={(newToken) => changeCollateral(newToken)}
                                                onAmountChange={(newAmount) => changeCollateralAmount(newAmount)}
                                                {...commonAssetInputProps}
                                            />
                                        </>
                                    }
                                    <BoostInfos
                                        inputToken={inputToken}
                                        collateralMarket={collateralMarket}
                                        borrowedMarket={dolaMarket!}
                                        inputAmount={inputAmount}
                                        invMarket={invMarket!}
                                        onLeverageChange={(v) => setLeverageLevel(v)}
                                    />
                                    <HStack w='full' justify="center">
                                        <SubmitButton fontSize="20px" themeColor="green.500" maxW="fit-content" h="60px" onClick={handleCreate}>
                                            <PlusSquareIcon mr="2" /> Create a new Boosted Position
                                        </SubmitButton>
                                    </HStack>
                                    <InfoMessage
                                        alertProps={{ w: 'full' }}
                                        description="No Tokens will be sent to your wallet, all tokens will be held in Contracts. All APYs can vary over time."
                                    />
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
