import { Flex, HStack, Link, Stack, Text, VStack } from '@chakra-ui/react'

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
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { SubmitButton } from '@app/components/common/Button'
import { useIsApproved } from '@app/hooks/useApprovals'
import { getScanner } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { sellV1AnToken } from '@app/util/contracts'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { commify, parseUnits } from '@ethersproject/units'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'
import { useAccount } from '@app/hooks/misc'

const { TOKENS, DEBT_REPAYER } = getNetworkConfigConstants();

type anToken = Token & { ctoken: string };

const anEth = '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8';
const anWbtc = '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b';
const anYfi = '0xde2af899040536884e062D3a334F2dD36F34b4a4';

export const DebtRepayerPage = () => {
    const { provider } = useWeb3React<Web3Provider>()
    const account = useAccount();
    const { markets } = useMarkets();
    const { exchangeRates } = useExchangeRatesV2();
    const { usdShortfall } = useAccountLiquidity()

    const weth = getToken(TOKENS, 'WETH')!;

    const v1markets = markets
        ?.filter(m => m.underlying.symbol.toLowerCase().endsWith('-v1'));

    const swapOptions = v1markets?.map(m => (m.token));
    const tokens: { [key: string]: anToken } = v1markets?.reduce((prev, curr) => ({ ...prev, [curr.token]: { ...curr.underlying, ctoken: curr.token } }), {});

    const [antokenAmount, setAntokenAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');

    const [outputToken, setOutputToken] = useState<Token>({})
    const [collateralMarket, setCollateralMarket] = useState<Market>({})

    const { isApproved, isAllBalanceApproved } = useIsApproved(collateralMarket?.token, DEBT_REPAYER, account, antokenAmount, true);

    const { balances: liquidities, isLoading: isLoadingLiquidity } = useBalances([outputToken.address], 'balanceOf', DEBT_REPAYER);
    const { balances: outputTokenBalances } = useBalances([outputToken.address], 'balanceOf');
    const { balances: anBalances } = useBalances([anEth, anWbtc, anYfi]);

    const { underlyingBalance: anEthBal } = useConvertToUnderlying(anEth, anBalances ? anBalances[anEth] : '0');
    const { underlyingBalance: anWbtcBal } = useConvertToUnderlying(anWbtc, anBalances ? anBalances[anWbtc] : '0');
    const { underlyingBalance: anYfiBal } = useConvertToUnderlying(anYfi, anBalances ? anBalances[anYfi] : '0');
    const balancesAsUnderlying = { [anEth]: anEthBal, [anWbtc]: anWbtcBal, [anYfi]: anYfiBal };

    const { discount, remainingDebt } = useMarketDebtRepayer(collateralMarket);
    const { output } = useDebtRepayerOutput(collateralMarket, antokenAmount, weth);
    const maxAnBalance = (anBalances || {})[collateralMarket.token];
    const { output: maxOutput } = useDebtRepayerOutput(collateralMarket, maxAnBalance, weth);
    const minOutput = output * 0.99;

    const commonAssetInputProps = { tokens: tokens, balances: balancesAsUnderlying, balanceKey: 'ctoken', showBalance: true }

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
        if (!provider?.getSigner()) { return }
        const min = parseUnits(roundFloorString(minOutput, 5), outputToken.decimals);
        return sellV1AnToken(provider?.getSigner(), collateralMarket?.token, antokenAmount, min);
    }

    const handleSellAll = () => {
        if (!provider?.getSigner()) { return }
        const maxAntokenAmount = anBalances[collateralMarket.token];
        const min = parseUnits(roundFloorString(maxOutput * 0.99, 5), outputToken.decimals);
        return sellV1AnToken(provider?.getSigner(), collateralMarket?.token, maxAntokenAmount, min);
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Repayer</title>
            </Head>
            <AppNav active="Borrow" activeSubmenu="Frontier - Debt Repayer" />
            <ErrorBoundary>
                <Flex direction="column" w={{ base: 'full' }} maxWidth="700px">
                    {
                        v1markets?.length > 0 && !!collateralMarket?.underlying ?
                            <Container
                                label="Debt Repayer"
                                description="See the Contract"
                                href={`${getScanner("1")}/address/${DEBT_REPAYER}`}
                                contentProps={{ p: '8' }}
                            >
                                <VStack w='full' alignItems="flex-start" spacing="5">
                                    <InfoMessage
                                        alertProps={{ fontSize: '12px' }}
                                        description={
                                            <VStack>
                                                <Text>
                                                    <b>Exchange</b> your v1 Frontier <b>receipt tokens</b> (anEth, anWBTC, anYFI) against their <b>underlying tokens</b> (WETH, WBTC, YFI).
                                                </Text>
                                                <Text>
                                                    The main purpose of the <b>DebtRepayer</b> is to give <b>priority to users</b> regarding available liquidity, avoiding liquidators taking it all. Please remember that <b>your borrowing limit will be impacted</b>, if you have a loan it's recommended to repay some debt first (the transaction may fail if it induces a shortfall).
                                                </Text>
                                                <Text>The DebtRepayer liquidity is distinct from the v1 markets liquidity.</Text>
                                                <Link isExternal target="_blank" color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/using-frontier/debt-converter-and-repayer">
                                                    Learn more in the docs
                                                </Link>
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
                                                <AnimatedInfoTooltip message="There can be a premium when Exchanging" />
                                                <Text>
                                                    Current Exchange Rate:
                                                </Text>
                                            </HStack>
                                            <Text fontWeight="bold">1 {collateralMarket.underlying.symbol} => {shortenNumber(discount, 4)} {outputToken.symbol}</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="Remaining Bad Debt in the chosen market" />
                                                <Text>
                                                    Remaining Debt:
                                                </Text>
                                            </HStack>
                                            <Text>{commify(remainingDebt.toFixed(2))} {collateralMarket.underlying.symbol}</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="DebtRepayer's Liquidity in the chosen market" />
                                                <Text>
                                                    Available Liquidity:
                                                </Text>
                                            </HStack>
                                            <Text>{shortenNumber(outputLiquidity, 4)} {outputToken.symbol}</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="Ratio of the Liquidity compared to the RemainingDebt" />
                                                <Text>
                                                    Reserve Ratio:
                                                </Text>
                                            </HStack>
                                            <Text>{remainingDebt ? shortenNumber(outputLiquidity / remainingDebt * 100, 2) : 0}%</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="Your current balance in the token you will receive when Exchanging" />
                                                <Text>
                                                    Your {outputToken.symbol} balance:
                                                </Text>
                                            </HStack>
                                            <Text>{shortenNumber(outputBalance, 4)} {outputToken.symbol}</Text>
                                        </Stack>
                                        <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                            <HStack>
                                                <AnimatedInfoTooltip message="The amount you will receive if there is no slippage" />
                                                <Text>
                                                    Receive Amount:
                                                </Text>
                                            </HStack>
                                            <Text>
                                                ~{shortenNumber(output, 4)} {outputToken.symbol}
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
                                                ~{shortenNumber(minOutput, 4)} {outputToken.symbol}
                                            </Text>
                                        </Stack>
                                        {
                                            usdShortfall > 0 ? <WarningMessage
                                                alertProps={{ w: 'full' }}
                                                description="Cannot use while being in Shortfall, please repay your debts first"
                                            /> :
                                                <HStack w='full' pt="4">
                                                    {
                                                        !isApproved ?
                                                            <ApproveButton
                                                                tooltipMsg=""
                                                                isDisabled={false}
                                                                address={collateralMarket?.token}
                                                                toAddress={DEBT_REPAYER}
                                                                signer={provider?.getSigner()}
                                                            />
                                                            :
                                                            <Stack direction={{ base: 'column', lg: 'row' }} w='full'>
                                                                <SubmitButton disabled={!collateralAmount || (parseFloat(collateralAmount) * discount > outputLiquidity) || !maxOutput || !outputLiquidity} onClick={handleSell} refreshOnSuccess={true}>
                                                                    exchange
                                                                </SubmitButton>
                                                                <SubmitButton disabled={!isAllBalanceApproved || !maxOutput || !outputLiquidity} onClick={handleSellAll} refreshOnSuccess={true}>
                                                                    exchange all available
                                                                </SubmitButton>
                                                            </Stack>
                                                    }
                                                </HStack>
                                        }

                                        {
                                            !outputLiquidity && !isLoadingLiquidity && <WarningMessage alertProps={{ w: 'full' }} description="No Liquidity at the moment" />
                                        }
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
