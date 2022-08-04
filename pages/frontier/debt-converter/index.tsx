import { Flex, HStack, Stack, Text, VStack } from '@chakra-ui/react'

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
import { dollarify, getBnToNumber, shortenNumber } from '@app/util/markets'
import { SubmitButton } from '@app/components/common/Button'
import { useAllowances } from '@app/hooks/useApprovals'
import { getScanner, hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { sellV1AnToken } from '@app/util/contracts'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { useDebtConverter } from '@app/hooks/useDebtConverter'
import { useOraclePrice } from '@app/hooks/usePrices'

const { TOKENS, DEBT_REPAYER, DEBT_CONVERTER } = getNetworkConfigConstants();

type anToken = Token & { ctoken: string };

const anEth = '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8';
const anWbtc = '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b';
const anYfi = '0xde2af899040536884e062D3a334F2dD36F34b4a4';

const outputToken = {
    address: '0x',
    name: 'DOLA IOU',
    symbol: 'IOU',
    image: 'https://assets.coingecko.com/coins/images/14287/small/anchor-logo-1-200x200.png',
    decimals: 18,
}

export const DebtConverterPage = () => {
    const { library, account } = useWeb3React<Web3Provider>()
    const { markets } = useMarkets();
    const { exchangeRates } = useExchangeRatesV2();
    const { exchangeRate: exRateIOU } = useDebtConverter();
    const { price } = useOraclePrice(anEth);

    const v1markets = markets
        ?.filter(m => m.underlying.symbol.toLowerCase().endsWith('-v1'));

    const swapOptions = v1markets?.map(m => (m.token));
    const tokens: { [key: string]: anToken } = v1markets?.reduce((prev, curr) => ({ ...prev, [curr.token]: { ...curr.underlying, ctoken: curr.token } }), {});

    const [outputAmount, setOutputAmount] = useState(0);
    const [collateralAmount, setCollateralAmount] = useState('');

    const [collateralMarket, setCollateralMarket] = useState<Market>({})

    const { approvals } = useAllowances([collateralMarket?.token], DEBT_CONVERTER);

    const { balances: liquidities } = useBalances([outputToken.address], 'balanceOf', DEBT_CONVERTER);
    const { balances: outputTokenBalances } = useBalances([outputToken.address], 'balanceOf');
    const { balances: anBalances } = useBalances([anEth, anWbtc, anYfi]);

    const { underlyingBalance: anEthBal } = useConvertToUnderlying(anEth, anBalances ? anBalances[anEth] : '0');
    const { underlyingBalance: anWbtcBal } = useConvertToUnderlying(anWbtc, anBalances ? anBalances[anWbtc] : '0');
    const { underlyingBalance: anYfiBal } = useConvertToUnderlying(anYfi, anBalances ? anBalances[anYfi] : '0');
    const balancesAsUnderlying = { [anEth]: anEthBal, [anWbtc]: anWbtcBal, [anYfi]: anYfiBal };

    const commonAssetInputProps = { tokens: tokens, balances: balancesAsUnderlying, balanceKey: 'ctoken', showBalance: true }

    const outputLiquidity = liquidities && liquidities[outputToken.address] ? getBnToNumber(liquidities[outputToken.address], outputToken.decimals) : 0;
    const outputBalance = outputTokenBalances && outputTokenBalances[outputToken.address] ? getBnToNumber(outputTokenBalances[outputToken.address], outputToken.decimals) : 0;

    useEffect(() => {
        if (!v1markets.length || collateralMarket.underlying) { return };
        setCollateralMarket(v1markets[0]);
    }, [v1markets, collateralMarket])

    useEffect(() => {
        setOutputAmount(parseFloat(collateralAmount||0) * price);
    }, [collateralAmount, price])

    const changeCollateral = (v: anToken) => {
        setCollateralMarket(v1markets.find(m => m.token === v.ctoken)!);
        changeCollateralAmount(collateralAmount);
    }

    const changeCollateralAmount = (newAmount: string) => {
        setCollateralAmount(newAmount);
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Converter</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Debt Converter" />
            <ErrorBoundary>
                <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="700px">
                    {
                        v1markets?.length > 0 && !!collateralMarket?.underlying ?
                            <Container
                                label="Debt Converter"
                                description="Contract"
                                href={`${getScanner("1")}/address/${DEBT_CONVERTER}`}
                                contentProps={{ p: '8' }}
                            >
                                <VStack w='full' alignItems="flex-start" spacing="5">
                                    <InfoMessage
                                        description={
                                            <VStack>
                                                <Text>
                                                    <b>Convert</b> your v1 Frontier <b>receipt tokens</b> (anEth, anWBTC, anYFI) into DOLA IOUs.
                                                </Text>
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
                                        {...commonAssetInputProps}
                                    />

                                    <VStack w='full' spacing="4">
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="Exchange Rate between IOUs and DOLA" />
                                                <Text>
                                                    IOU Exchange Rate:
                                                </Text>
                                            </HStack>
                                            <Text>1 IOU => {shortenNumber(exRateIOU, 2)} DOLA</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="Remaining Bad Debt in the chosen market" />
                                                <Text>
                                                    {collateralMarket.underlying.symbol} Oracle Price:
                                                </Text>
                                            </HStack>
                                            <Text>{dollarify(price, 2)}</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="Your current IOU balance:" />
                                                <Text>
                                                    Your current {outputToken.symbol} balance:
                                                </Text>
                                            </HStack>
                                            <Text>{shortenNumber(outputBalance, 2)} {outputToken.symbol}</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="The amount you will receive if there is no slippage" />
                                                <Text>
                                                    Receive Amount:
                                                </Text>
                                            </HStack>
                                            <Text>
                                                ~{shortenNumber(outputAmount, 2)} {outputToken.symbol}
                                            </Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="The minimum amount you accept to receive after possible slippage, if it's below, the transaction will revert" />
                                                <Text>
                                                    Min. Receive Amount:
                                                </Text>
                                            </HStack>
                                            <Text fontWeight="bold">
                                                ~{shortenNumber(outputAmount * 0.99, 2)} {outputToken.symbol}
                                            </Text>
                                        </Stack>
                                        <HStack w='full' pt="4">
                                            {
                                                !hasAllowance(approvals, collateralMarket?.token) ?
                                                    <ApproveButton
                                                        tooltipMsg=""
                                                        isDisabled={false}
                                                        address={collateralMarket?.token}
                                                        toAddress={DEBT_CONVERTER}
                                                        signer={library?.getSigner()}
                                                    />
                                                    :
                                                    <Stack direction={{ base: 'column', lg: 'row' }} w='full'>
                                                        <SubmitButton refreshOnSuccess={true}>
                                                            exchange
                                                        </SubmitButton>
                                                        <SubmitButton refreshOnSuccess={true}>
                                                            exchange all available
                                                        </SubmitButton>
                                                    </Stack>
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

export default DebtConverterPage
