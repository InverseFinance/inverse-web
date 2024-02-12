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
import { getNetworkConfigConstants } from '@app/util/networks'
import { useBalances } from '@app/hooks/useBalances'
import { Market, Token } from '@app/types'

import { SkeletonBlob } from '@app/components/common/Skeleton'

import { useExchangeRatesV2 } from '@app/hooks/useExchangeRates'
import { roundFloorString } from '@app/util/misc'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { dollarify, getBnToNumber, getMonthlyRate, shortenNumber } from '@app/util/markets'
import { SubmitButton } from '@app/components/common/Button'
import { useIsApproved } from '@app/hooks/useApprovals'
import { getScanner } from '@app/util/web3'
import { ApproveButton } from '@app/components/Anchor/AnchorButton'
import { convertToIOU } from '@app/util/contracts'
import { AnimatedInfoTooltip, InfoPopover } from '@app/components/common/Tooltip'
import { useDebtConverter, useDebtConverterMaxUnderlyingPrice, useIOUbalance } from '@app/hooks/useDebtConverter'
import { useOraclePrice } from '@app/hooks/usePrices'
import { useConvertToUnderlying } from '@app/hooks/useDebtRepayer'
import { DebtConversions } from '@app/components/Anchor/DebtConverter/DebtConversions'
import { useRouter } from 'next/router'

import { parseEther } from 'ethers/lib/utils';
import Link from '@app/components/common/Link'
import { UNDERLYING } from '@app/variables/tokens'
import { useAccountLiquidity } from '@app/hooks/useAccountLiquidity'

const { DEBT_CONVERTER } = getNetworkConfigConstants();

type TokenWithCtoken = Token & { ctoken: string };

const anEth = '0x697b4acAa24430F254224eB794d2a85ba1Fa1FB8';
const anWbtc = '0x17786f3813E6bA35343211bd8Fe18EC4de14F28b';
const anYfi = '0xde2af899040536884e062D3a334F2dD36F34b4a4';

const compatibleCtokens = [anEth, anWbtc, anYfi];
const v1markets = compatibleCtokens.map(an => {
    return { underlying: UNDERLYING[an], ctoken: an };
});

export const DebtConverterPage = () => {
    const { provider, account } = useWeb3React<Web3Provider>()
    const { query } = useRouter()
    const userAddress = (query?.viewAddress as string) || account;
    const { exchangeRates } = useExchangeRatesV2();
    const { exchangeRate: exRateIOU, apr, outstandingDebt } = useDebtConverter();
    const { usdShortfall } = useAccountLiquidity();
    const { IOUbalance } = useIOUbalance(userAddress);

    const tokens: { [key: string]: TokenWithCtoken } = v1markets?.reduce((prev, curr) => ({ ...prev, [curr.ctoken]: { ...curr.underlying, ctoken: curr.ctoken } }), {});

    const [outputAmount, setOutputAmount] = useState(0);
    const [antokenAmount, setAntokenAmount] = useState('');
    const [collateralAmount, setCollateralAmount] = useState('');

    const [collateralMarket, setCollateralMarket] = useState<Partial<Market>>({})
    const { price } = useOraclePrice(collateralMarket?.ctoken);
    const { maxUnderlyingPrice } = useDebtConverterMaxUnderlyingPrice(collateralMarket?.ctoken);

    const maxPrice = (maxUnderlyingPrice !== 0 && maxUnderlyingPrice !== null ? maxUnderlyingPrice : price) || 0;

    const { isApproved, isAllBalanceApproved } = useIsApproved(collateralMarket?.ctoken, DEBT_CONVERTER, userAddress, antokenAmount, true);
    const { balances: anBalances } = useBalances([anEth, anWbtc, anYfi]);
    const { underlyingBalance: anEthBal } = useConvertToUnderlying(anEth, anBalances ? anBalances[anEth] : '0');
    const { underlyingBalance: anWbtcBal } = useConvertToUnderlying(anWbtc, anBalances ? anBalances[anWbtc] : '0');
    const { underlyingBalance: anYfiBal } = useConvertToUnderlying(anYfi, anBalances ? anBalances[anYfi] : '0');
    const balancesAsUnderlying = { [anEth]: anEthBal, [anWbtc]: anWbtcBal, [anYfi]: anYfiBal };

    const commonAssetInputProps = { tokens: tokens, balances: balancesAsUnderlying, balanceKey: 'ctoken', showBalance: true }

    const minOutput = outputAmount * 0.99;

    useEffect(() => {
        if (!v1markets.length || collateralMarket.underlying) { return };
        setCollateralMarket(v1markets[0]);
    }, [v1markets, collateralMarket])

    useEffect(() => {
        const outputPrice = Math.min(price || 0, maxPrice);
        setOutputAmount(parseFloat(collateralAmount || 0) * outputPrice);
    }, [collateralAmount, price, maxPrice])

    const changeCollateral = (v: TokenWithCtoken) => {
        setCollateralMarket(v1markets.find(m => m.ctoken === v.ctoken)!);
        changeCollateralAmount(collateralAmount);
    }

    const changeCollateralAmount = (newAmount: string) => {
        setCollateralAmount(newAmount);
        const amount = newAmount || '0';
        const exRate = exchangeRates && exchangeRates[collateralMarket.ctoken] ? getBnToNumber(exchangeRates[collateralMarket.ctoken]) : 0;
        const anAmount = exRate ? parseFloat(amount) / exRate : parseFloat(amount);
        const formattedAmount = roundFloorString(anAmount * (10 ** collateralMarket.underlying.decimals), 0);
        setAntokenAmount(formattedAmount);
    }

    const handleConvert = (isAllCase = false) => {
        return convertToIOU(
            provider?.getSigner(),
            collateralMarket.ctoken,
            (isAllCase ? '0' : antokenAmount),
            parseEther(minOutput.toFixed(2)),
        );
    }

    const monthyDOLAEarnings = getMonthlyRate(IOUbalance, apr);

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Debt Converter</title>
            </Head>
            <AppNav active="More" activeSubmenu="Frontier - Debt Converter" />
            <ErrorBoundary>
                <VStack maxWidth="1200px">
                    <VStack maxW={"700px"}>
                        {
                            v1markets?.length > 0 && !!collateralMarket?.underlying ?
                                <Container
                                    label="Debt Converter"
                                    description="See the Contract"
                                    href={`${getScanner("1")}/address/${DEBT_CONVERTER}`}
                                    contentProps={{ p: '8' }}
                                    right={
                                        IOUbalance > 0 && <InfoPopover
                                            tooltipProps={{ className: `blurred-container success-bg`, borderColor: 'success' }}
                                            message={
                                                <Text fontWeight="bold">
                                                    Monthly interests: {shortenNumber(monthyDOLAEarnings, 2)} DOLAs
                                                </Text>
                                            }>
                                            <Text>
                                                Your IOUs: {shortenNumber(IOUbalance, 2)}
                                            </Text>
                                        </InfoPopover>
                                    }
                                >
                                    <VStack w='full' alignItems="flex-start" spacing="5">
                                        <InfoMessage
                                            alertProps={{
                                                fontSize: '12px'
                                            }}
                                            description={
                                                <VStack>
                                                    <Text>
                                                        <b>Convert</b> your v1 Frontier stuck tokens (ETH-V1, WBTC-v1 or YFI-V1) into DOLA IOUs.
                                                    </Text>
                                                    <Text>
                                                        Note: you will be able to <b>progressively redeem</b> your DOLA IOUs and get DOLA against them <b>each time the Inverse Treasury makes a Debt Repayment</b> to the Debt Converter contract. The redeemable part of the IOUs will be <b>proportional</b> to the size of the repayment compared to the total debt put into the contract. Please remember that <b>your borrowing limit will be impacted</b>, if you have a loan it's recommended to repay some debt first (the transaction may fail if it induces a shortfall).
                                                    </Text>
                                                    <Link isExternal target="_blank" color="secondaryTextColor" href="https://docs.inverse.finance/inverse-finance/using-frontier/debt-converter-and-repayer">
                                                        Learn more in the docs
                                                    </Link>
                                                </VStack>
                                            }
                                        />
                                        <AssetInput
                                            amount={collateralAmount}
                                            token={{ ...collateralMarket?.underlying, ctoken: collateralMarket?.ctoken }}
                                            assetOptions={compatibleCtokens}
                                            onAssetChange={(newToken) => changeCollateral(newToken)}
                                            onAmountChange={(newAmount) => changeCollateralAmount(newAmount)}
                                            orderByBalance={true}
                                            dropdownSelectedProps={{ fontSize: '12px' }}
                                            {...commonAssetInputProps}
                                        />

                                        <VStack w='full' spacing="4">
                                            <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                                <HStack>
                                                    <AnimatedInfoTooltip message="Exchange Rate between IOUs and DOLA, increases over time." />
                                                    <Text>
                                                        Current IOU Exchange Rate:
                                                    </Text>
                                                </HStack>
                                                <Text fontWeight="bold">1 IOU => {shortenNumber(exRateIOU, 4)} DOLA</Text>
                                            </Stack>
                                            <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                                <HStack>
                                                    <AnimatedInfoTooltip message={
                                                        <Text>
                                                            The Exchange Rate between IOUs and DOLAs increases over time, meaning <b>your IOUs generate interests in DOLA</b>.
                                                        </Text>
                                                    } />
                                                    <Text>
                                                        Current Interest Rate:
                                                    </Text>
                                                </HStack>
                                                <Text>{shortenNumber(apr, 4)}%</Text>
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
                                            {
                                                price !== null && maxPrice <= (0.7 * price) && <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                                    <HStack>
                                                        <AnimatedInfoTooltip message="The max price is set to the price during the exploit" />
                                                        <Text>
                                                            {collateralMarket.underlying.symbol} Max accepted Price:
                                                        </Text>
                                                    </HStack>
                                                    <Text>{dollarify(maxPrice, 2)}</Text>
                                                </Stack>
                                            }
                                            <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                                <HStack>
                                                    <AnimatedInfoTooltip message="Current amount of DOLA-denominated debt accrued by the DebtConverter contract" />
                                                    <Text>
                                                        Current Outstanding Debt in Contract:
                                                    </Text>
                                                </HStack>
                                                <Text>
                                                    ~{shortenNumber(outstandingDebt, 2)}
                                                </Text>
                                            </Stack>
                                            <Stack w='full' justify="space-between" direction={{ base: 'column', lg: 'row' }} >
                                                <HStack>
                                                    <AnimatedInfoTooltip message="The amount of DOLA worth of IOUs you will receive if there is no slippage" />
                                                    <Text>
                                                        DOLA worth of the IOUs to receive:
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
                                                        Min. DOLA worth to receive:
                                                    </Text>
                                                </HStack>
                                                <Text fontWeight="bold">
                                                    ~{shortenNumber(minOutput, 2)}
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
                                                                    address={collateralMarket?.ctoken}
                                                                    toAddress={DEBT_CONVERTER}
                                                                    signer={provider?.getSigner()}
                                                                    forceRefresh={true}
                                                                />
                                                                :
                                                                <Stack direction={{ base: 'column', lg: 'row' }} w='full'>
                                                                    <SubmitButton
                                                                        disabled={!collateralAmount || !parseFloat(collateralAmount)}
                                                                        onClick={() => handleConvert(false)}
                                                                        refreshOnSuccess={true}>
                                                                        convert
                                                                    </SubmitButton>
                                                                    <SubmitButton disabled={!isAllBalanceApproved} onClick={() => handleConvert(true)} refreshOnSuccess={true}>
                                                                        convert all
                                                                    </SubmitButton>
                                                                </Stack>
                                                        }
                                                    </HStack>
                                            }

                                        </VStack>
                                    </VStack>
                                </Container>
                                : <SkeletonBlob />
                        }
                    </VStack>
                    {
                        !!account && <DebtConversions account={userAddress} signer={provider?.getSigner()} />
                    }
                </VStack>
                <Link color="accentTextColor" mt="5" href="/frontier/debt-converter/repayments">Go to Debt Converter Repayments</Link>
            </ErrorBoundary>
        </Layout>
    )
}

export default DebtConverterPage
