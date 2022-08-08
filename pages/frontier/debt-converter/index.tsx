import { HStack, Stack, Text, VStack } from '@chakra-ui/react'

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

import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { roundFloorString } from '@app/util/misc'
import { InfoMessage } from '@app/components/common/Messages'
import { dollarify, getBnToNumber, shortenNumber } from '@app/util/markets'
import { SubmitButton } from '@app/components/common/Button'
import { useAllowances } from '@app/hooks/useApprovals'
import { getScanner, hasAllowance } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { convertToIOU } from '@app/util/contracts'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { useDebtConverter } from '@app/hooks/useDebtConverter'
import { useOraclePrice } from '@app/hooks/usePrices'
import { useConvertToUnderlying } from '@app/hooks/useDebtRepayer'
import { DebtConversions } from '@app/components/Anchor/DebtConverter/DebtConversions'
import { useRouter } from 'next/router'

import { parseEther } from 'ethers/lib/utils';

const { DEBT_CONVERTER } = getNetworkConfigConstants();

type anToken = Token & { ctoken: string };

const anEth = '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8';
const anWbtc = '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b';
// const anYfi = '0xde2af899040536884e062D3a334F2dD36F34b4a4';
const anYfi = '0xD60B06B457bFf7fc38AC5E7eCE2b5ad16B288326';

const compatibleMarkets = [anEth, anWbtc, anYfi];

const outputToken = {
    address: DEBT_CONVERTER,
    name: 'DOLA IOU',
    symbol: 'IOU',
    image: 'https://assets.coingecko.com/coins/images/14287/small/anchor-logo-1-200x200.png',
    decimals: 18,
}

export const DebtConverterPage = () => {
    const { library, account } = useWeb3React<Web3Provider>()
    const { query } = useRouter()
    const userAddress = (query?.viewAddress as string) || account;
    const { markets } = useMarkets();
    const { exchangeRates } = useExchangeRatesV2();
    const { exchangeRate: exRateIOU, repaymentEpoch } = useDebtConverter(account);

    const v1markets = markets
        ?.filter(m => compatibleMarkets.includes(m.token));

    const swapOptions = v1markets?.map(m => (m.token));
    const tokens: { [key: string]: anToken } = v1markets?.reduce((prev, curr) => ({ ...prev, [curr.token]: { ...curr.underlying, ctoken: curr.token } }), {});

    const [outputAmount, setOutputAmount] = useState(0);
    const [antokenAmount, setAntokenAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');

    const [collateralMarket, setCollateralMarket] = useState<Market>({})
    const { price } = useOraclePrice(collateralMarket?.token);

    const { approvals } = useAllowances([collateralMarket?.token], DEBT_CONVERTER);

    const { balances: outputTokenBalances } = useBalances([DEBT_CONVERTER], 'balanceOf', userAddress);

    const { balances: anBalances } = useBalances([anEth, anWbtc, anYfi]);
    const { underlyingBalance: anEthBal } = useConvertToUnderlying(anEth, anBalances ? anBalances[anEth] : '0');
    const { underlyingBalance: anWbtcBal } = useConvertToUnderlying(anWbtc, anBalances ? anBalances[anWbtc] : '0');
    const { underlyingBalance: anYfiBal } = useConvertToUnderlying(anYfi, anBalances ? anBalances[anYfi] : '0');
    const balancesAsUnderlying = { [anEth]: anEthBal, [anWbtc]: anWbtcBal, [anYfi]: anYfiBal };

    const commonAssetInputProps = { tokens: tokens, balances: balancesAsUnderlying, balanceKey: 'ctoken', showBalance: true }

    const outputBalance = outputTokenBalances && outputTokenBalances[outputToken.address] ? getBnToNumber(outputTokenBalances[outputToken.address], outputToken.decimals) : 0;

    const minOutput = outputAmount * 0.99;

    useEffect(() => {
        if (!v1markets.length || collateralMarket.underlying) { return };
        setCollateralMarket(v1markets[0]);
    }, [v1markets, collateralMarket])

    useEffect(() => {
        setOutputAmount(parseFloat(collateralAmount || 0) * price);
    }, [collateralAmount, price])

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

    const handleConvert = (isAllCase = false) => {
        return convertToIOU(
            library?.getSigner(),
            collateralMarket.token,
            (isAllCase ? '0' : antokenAmount),
            parseEther(minOutput.toString()),
        );
    }

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Debt Converter</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Debt Converter" />
            <ErrorBoundary>
                <VStack maxWidth="1200px">
                    <VStack maxW={"700px"}>
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
                                                    <AnimatedInfoTooltip message="Repayments are made in different Epochs" />
                                                    <Text>
                                                        Repayment Epoch:
                                                    </Text>
                                                </HStack>
                                                <Text>{repaymentEpoch}</Text>
                                            </Stack>
                                            <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                                <HStack>
                                                    <AnimatedInfoTooltip message="Remaining Bad Debt in the chosen market" />
                                                    <Text>
                                                        {collateralMarket.underlying.symbol} Oracle Price:
                                                    </Text>
                                                </HStack>
                                                <Text>{price ? dollarify(price, 2) : '-'}</Text>
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
                                                    <AnimatedInfoTooltip message="The amount of DOLA worth of IOUs you will receive if there is no slippage" />
                                                    <Text>
                                                        DOLA worth of IOUs:
                                                    </Text>
                                                </HStack>
                                                <Text>
                                                    ~{shortenNumber(outputAmount, 2)}
                                                </Text>
                                            </Stack>
                                            <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                                <HStack>
                                                    <AnimatedInfoTooltip message="The minimum amount of DOLA worth of IOUs you accept to receive after possible slippage, if it's below, the transaction will revert" />
                                                    <Text>
                                                        Min. Receive Amount:
                                                    </Text>
                                                </HStack>
                                                <Text fontWeight="bold">
                                                    ~{shortenNumber(minOutput, 2)}
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
                                                            <SubmitButton
                                                                disabled={!collateralAmount || !parseFloat(collateralAmount)}
                                                                onClick={() => handleConvert(false)}
                                                                refreshOnSuccess={true}>
                                                                convert
                                                            </SubmitButton>
                                                            <SubmitButton onClick={() => handleConvert(true)} refreshOnSuccess={true}>
                                                                convert all
                                                            </SubmitButton>
                                                        </Stack>
                                                }
                                            </HStack>
                                        </VStack>
                                    </VStack>
                                </Container>
                                : <SkeletonBlob />
                        }
                    </VStack>
                    {
                        !!account && <DebtConversions account={userAddress} />
                    }
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default DebtConverterPage
