import { Flex, HStack, Text, VStack } from '@chakra-ui/react'

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

import { getToken } from '@app/variables/tokens'
import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { roundFloorString } from '@app/util/misc'
import { useConvertToUnderlying, useDebtRepayerOutput, useMarketDebtRepayer } from '@app/hooks/useDebtRepayer'
import { InfoMessage } from '@app/components/common/Messages'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { SubmitButton } from '@app/components/common/Button'
import { useAllowances } from '@app/hooks/useApprovals'
import { hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { sellV1AnToken } from '@app/util/contracts'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'

const { TOKENS, DEBT_REPAYER } = getNetworkConfigConstants();

type anToken = Token & { ctoken: string };

export const DebtRepayerPage = () => {
    const { library, account } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();
    const { exchangeRates } = useExchangeRatesV2();

    const weth = getToken(TOKENS, 'WETH')!;

    const v1markets = markets
        ?.filter(m => m.underlying.symbol.toLowerCase().endsWith('-v1'));

    const swapOptions = v1markets?.map(m => (m.token));
    const tokens: { [key: string]: anToken } = v1markets?.reduce((prev, curr) => ({ ...prev, [curr.token]: { ...curr.underlying, ctoken: curr.token } }), {});

    const [outputAmount, setOutputAmount] = useState('');
    const [antokenAmount, setAntokenAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');

    const [outputToken, setOutputToken] = useState<Token>({})
    const [collateralMarket, setCollateralMarket] = useState<Market>({})

    const { approvals } = useAllowances([collateralMarket?.token], DEBT_REPAYER);

    const { balances: liquidities } = useBalances([outputToken.address], 'balanceOf', DEBT_REPAYER);
    const { balances: outputTokenBalances } = useBalances([outputToken.address], 'balanceOf');
    const { balances: anBalances } = useBalances([collateralMarket.token]);

    const { underlyingBalance } = useConvertToUnderlying(collateralMarket.token, anBalances ? anBalances[collateralMarket.token] : '0');
    const balancesAsUnderlying = { [collateralMarket.token]: underlyingBalance };

    const { discount, remainingDebt } = useMarketDebtRepayer(collateralMarket);
    const { output } = useDebtRepayerOutput(collateralMarket, antokenAmount, weth);
    const maxAnBalance = (anBalances || {})[collateralMarket.token];
    const { output: maxOutput } = useDebtRepayerOutput(collateralMarket, maxAnBalance, weth);
    const minOutput = output * 0.99;

    const commonAssetInputProps = { tokens: tokens, balances: balancesAsUnderlying, balanceKey: 'ctoken', showBalance: false }

    const outputLiquidity = liquidities && liquidities[outputToken.address] ? getBnToNumber(liquidities[outputToken.address], outputToken.decimals) : 0;
    const outputBalance = outputTokenBalances && outputTokenBalances[outputToken.address] ? getBnToNumber(outputTokenBalances[outputToken.address], outputToken.decimals) : 0;

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

    const handleSell = () => {
        if (!library?.getSigner()) { return }
        const min = roundFloorString(minOutput * (10 ** outputToken.decimals), outputToken.decimals);
        return sellV1AnToken(library?.getSigner(), collateralMarket?.token, antokenAmount, min);
    }

    const handleSellAll = () => {
        if (!library?.getSigner()) { return }
        const maxAntokenAmount = anBalances[collateralMarket.token];
        const min = roundFloorString(maxOutput * 0.99 * (10 ** outputToken.decimals), outputToken.decimals);
        return sellV1AnToken(library?.getSigner(), collateralMarket?.token, maxAntokenAmount, min);
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Repayer</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Debt Repayer" />
            <ErrorBoundary>
                <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="700px">
                    {
                        v1markets?.length > 0 && !!collateralMarket?.underlying ?
                            <Container
                                label="Debt Repayer"
                                contentProps={{ p: '8' }}
                            >
                                <VStack w='full' alignItems="flex-start" spacing="5">
                                    <InfoMessage
                                        description={
                                            <VStack>
                                                <Text>
                                                    <b>Exchange</b> your v1 Frontier <b>receipt tokens</b> (anEth, anWBTC, anYFI) against their <b>underlying tokens</b> (WETH, WBTC, YFI).
                                                </Text>
                                                <Text>
                                                    The main purpose of the <b>DebtRepayer</b> is to give <b>priority to users</b> regarding available liquidity, avoiding liquidators taking it all.
                                                </Text>
                                                <Text>The DebtRepayer liquidity is distinct from the v1 markets liquidity.</Text>
                                            </VStack>
                                        }
                                    />
                                    <AssetInput
                                        amount={collateralAmount}
                                        token={{ ...collateralMarket?.underlying, ctoken: collateralMarket.token }}
                                        assetOptions={swapOptions}
                                        onAssetChange={(newToken) => changeCollateral(newToken)}
                                        onAmountChange={(newAmount) => changeCollateralAmount(newAmount)}
                                        orderByBalance={true}
                                        dropdownSelectedProps={{ fontSize: '12px' }}
                                        inputProps={{ placeholder: 'Amount to Sell' }}
                                        {...commonAssetInputProps}
                                    />

                                    <VStack w='full' spacing="4">
                                        <HStack w='full' justify="space-between">
                                            <HStack>
                                                <AnimatedInfoTooltip message="There can be a premium when Exchanging" />
                                                <Text>
                                                    Sell Rate:
                                                </Text>
                                            </HStack>
                                            <Text>1 {collateralMarket.underlying.symbol} => {shortenNumber(discount, 2)} {outputToken.symbol}</Text>
                                        </HStack>
                                        <HStack w='full' justify="space-between">
                                            <HStack>
                                                <AnimatedInfoTooltip message="Remaining Bad Debt in the chosen market" />
                                                <Text>
                                                    Remaining Debt:
                                                </Text>
                                            </HStack>
                                            <Text>{shortenNumber(remainingDebt, 2)} {collateralMarket.underlying.symbol}</Text>
                                        </HStack>
                                        <HStack w='full' justify="space-between">
                                            <HStack>
                                                <AnimatedInfoTooltip message="DebtRepayer's Liquidity in the chosen market" />
                                                <Text>
                                                    Available Liquidity:
                                                </Text>
                                            </HStack>
                                            <Text>{shortenNumber(outputLiquidity, 2)} {outputToken.symbol}</Text>
                                        </HStack>
                                        <HStack w='full' justify="space-between">
                                            <HStack>
                                                <AnimatedInfoTooltip message="Your current balance in the token you will receive when Exchanging" />
                                                <Text>
                                                    Your {outputToken.symbol} balance:
                                                </Text>
                                            </HStack>
                                            <Text>{shortenNumber(outputBalance, 2)} {outputToken.symbol}</Text>
                                        </HStack>
                                        <HStack w='full' justify="space-between">
                                            <HStack>
                                                <AnimatedInfoTooltip message="The amount you will receive if there is no slippage" />
                                                <Text>
                                                    Receive Amount:
                                                </Text>
                                            </HStack>
                                            <Text>
                                                ~{shortenNumber(output, 4)} {outputToken.symbol}
                                            </Text>
                                        </HStack>
                                        <HStack w='full' justify="space-between">
                                            <HStack>
                                                <AnimatedInfoTooltip message="The minimum amount you accept to receive, if it's below the transaction will revert" />
                                                <Text>
                                                    Min. Receive Amount:
                                                </Text>
                                            </HStack>
                                            <Text fontWeight="bold">
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
                                                    <>
                                                        <SubmitButton onClick={handleSell} refreshOnSuccess={true}>
                                                            sell
                                                        </SubmitButton>
                                                        <SubmitButton onClick={handleSellAll} refreshOnSuccess={true}>
                                                            sell all
                                                        </SubmitButton>
                                                    </>
                                            }
                                        </HStack>
                                    </VStack>
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
