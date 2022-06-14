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
import { useBalances, useSuppliedBalances, useSupplyBalances } from '@app/hooks/useBalances'
import { Market, Token } from '@app/types'

import { SkeletonBlob } from '@app/components/common/Skeleton'

import { getToken } from '@app/variables/tokens'
import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { roundFloorString } from '@app/util/misc'
import { useDebtRepayer, useDebtRepayerOutput, useMarketDebtRepayer } from '@app/hooks/useDebtRepayer'
import { InfoMessage } from '@app/components/common/Messages'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { SubmitButton } from '@app/components/common/Button'
import { useAllowances } from '@app/hooks/useApprovals'
import { hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'

const { TOKENS, DEBT_REPAYER } = getNetworkConfigConstants();

type anToken = Token & { ctoken: string };

export const DebtRepayerPage = () => {
    const { library } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();
    const { exchangeRates } = useExchangeRatesV2();

    const weth = getToken(TOKENS, 'WETH')!;

    const v1markets = markets
        ?.filter(m => m.underlying.symbol.toLowerCase().endsWith('-v1'));

    const swapOptions = v1markets?.map(m => (m.token));
    const tokens: { [key: string]: anToken } = v1markets?.reduce((prev, curr) => ({ ...prev, [curr.token]: { ...curr.underlying, ctoken: curr.token } }), {});

    const supplied = useSuppliedBalances();

    const balancesAsUnderlying = supplied?.reduce((prev, curr) => {
        return { ...prev, [curr.token]: parseUnits(roundFloorString(curr.balance, curr.underlying.decimals), curr.underlying.decimals) }
    }, {})

    const [outputAmount, setOutputAmount] = useState('');
    const [antokenAmount, setAntokenAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');

    const [outputToken, setOutputToken] = useState<Token>({})
    const [collateralMarket, setCollateralMarket] = useState<Market>({})

    const { approvals } = useAllowances([collateralMarket?.token], DEBT_REPAYER);

    const { discount, remainingDebt } = useMarketDebtRepayer(collateralMarket);
    const { output } = useDebtRepayerOutput(collateralMarket, antokenAmount, weth);
    const minOutput = output * 0.99;

    const commonAssetInputProps = { tokens: tokens, balances: balancesAsUnderlying, balanceKey: 'ctoken', showBalance: false }

    const { balances: liquidities } = useBalances([outputToken.address], 'balanceOf', DEBT_REPAYER);
    const outputLiquidity = liquidities && liquidities[outputToken.address] ? getBnToNumber(liquidities[outputToken.address], outputToken.decimals) : 0;

    useEffect(() => {
        if (!v1markets.length || collateralMarket.underlying) { return };
        setCollateralMarket(v1markets[0]);
    }, [v1markets, collateralMarket])

    useEffect(() => {
        if (!collateralMarket?.underlying) { return };
        setOutputToken(collateralMarket.underlying.address ?
            { ...collateralMarket.underlying, symbol: collateralMarket.underlying.symbol.replace('-v1', '') }
            :
            weth
        );
    }, [collateralMarket])

    const changeCollateral = (v: anToken) => {
        setCollateralMarket(v1markets.find(m => m.token === v.ctoken)!);
        changeCollateralAmount(collateralAmount);
    }

    const changeCollateralAmount = (newAmount: string) => {
        setCollateralAmount(newAmount);
        const amount = newAmount || '0';
        const exRate = exchangeRates && exchangeRates[collateralMarket.token] ? getBnToNumber(exchangeRates[collateralMarket.token]) : 0;
        const anAmount = exRate ? parseFloat(amount) / exRate : parseFloat(amount);
        const formattedAmount = roundFloorString(anAmount * (10 ** collateralMarket.underlying.decimals), 0);
        setAntokenAmount(formattedAmount);
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Repayer</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Debt Repayer" />
            <ErrorBoundary>
                <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="600px">
                    {
                        v1markets?.length > 0 && !!collateralMarket?.underlying ?
                            <Container
                                contentProps={{ p: '8' }}
                            >
                                <VStack w='full' alignItems="flex-start" spacing="5">
                                    <AssetInput
                                        amount={collateralAmount}
                                        token={{ ...collateralMarket?.underlying, ctoken: collateralMarket.token }}
                                        assetOptions={swapOptions}
                                        onAssetChange={(newToken) => changeCollateral(newToken)}
                                        onAmountChange={(newAmount) => changeCollateralAmount(newAmount)}
                                        orderByBalance={true}
                                        dropdownSelectedProps={{ fontSize: '12px' }}
                                        {...commonAssetInputProps}
                                    />

                                    <InfoMessage
                                        alertProps={{ w: 'full' }}
                                        description={<VStack w='full'>
                                            <HStack w='full' justify="space-between">
                                                <Text>
                                                    - Sell Rate:
                                                </Text>
                                                <Text>1 {collateralMarket.underlying.symbol} => {shortenNumber(discount, 2)} {outputToken.symbol}</Text>
                                            </HStack>
                                            <HStack w='full' justify="space-between">
                                                <Text>
                                                    - Remaining Debt:
                                                </Text>
                                                <Text>{shortenNumber(remainingDebt, 2)} {collateralMarket.underlying.symbol}</Text>
                                            </HStack>
                                            <HStack w='full' justify="space-between">
                                                <Text>
                                                    - Liquidity in DebtRepayer:
                                                </Text>
                                                <Text>{shortenNumber(outputLiquidity, 2)} {outputToken.symbol}</Text>
                                            </HStack>
                                            <HStack w='full' justify="space-between">
                                                <Text>
                                                    - Receive Amount:
                                                </Text>
                                                <Text>
                                                    ~{shortenNumber(output, 4)} {outputToken.symbol}
                                                </Text>
                                            </HStack>
                                            <HStack w='full' justify="space-between">
                                                <Text>
                                                    - Min Receive Amount:
                                                </Text>
                                                <Text>
                                                    ~{shortenNumber(minOutput, 4)} {outputToken.symbol}
                                                </Text>
                                            </HStack>
                                            <HStack>
                                                {
                                                    !hasAllowance(approvals, collateralMarket?.token) ?
                                                        <ApproveButton
                                                            tooltipMsg=""
                                                            isDisabled={false}
                                                            address={collateralMarket?.token}
                                                            toAddress={DEBT_REPAYER}
                                                            signer={library?.getSigner()}
                                                        />
                                                        :
                                                        <SubmitButton>
                                                            sell
                                                        </SubmitButton>
                                                }
                                            </HStack>
                                        </VStack>}
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

export default DebtRepayerPage
