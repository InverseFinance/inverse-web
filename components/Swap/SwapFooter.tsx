
import { useEffect, useState } from 'react'
import { Text, TextProps, VStack, Flex, HStack, Switch, AlertProps } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@app/util/wallet'
import { Swappers, Token } from '@app/types';
import { RadioCardGroup } from '@app/components/common/Input/RadioCardGroup'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { StatusMessage } from '@app/components/common/Messages'
import { SwapSlippage } from './SwapSlippage'
import { ethereumReady } from '@app/util/web3';
import { SwapRoute } from './SwapRoute';
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton';

const SwapInfoMessage = ({ description, height, status = 'info' }: { description: string, height?: string, status?: AlertProps["status"] }) => {
    return <StatusMessage status={status} alertProps={{ w: 'full', fontSize: '12px', height }} description={description} />
}

const SwapText = ({ children, ...props }: { children: React.ReactNode } & Partial<TextProps>) => {
    return <Text color={'secondaryTextColor'} textAlign="center" w="full" fontSize="12px" {...props}>
        {children}
    </Text>
}

export const SwapFooter = ({
    bestRoute,
    onRouteChange,
    routes,
    chosenRoute,
    canUseStabilizer,
    noStabilizerLiquidity,
    notEnoughTokens,
    exRates,
    fromToken,
    toToken,
    isDisabled,
    handleSubmit,
    toAmount,
    isApproved,
    maxSlippage,
    costs,
    ethPriceUsd,
    includeCostInBestRate,
    onIncludeTxCostChange,
    onMaxSlippageChange,
}: {
    bestRoute: Swappers | '',
    onRouteChange: (v: Swappers) => void,
    routes: any[],
    chosenRoute: Swappers,
    canUseStabilizer: boolean,
    noStabilizerLiquidity: boolean,
    notEnoughTokens: boolean,
    isDisabled: boolean,
    isApproved: boolean,
    exRates: any,
    fromToken: Token,
    toToken: Token,
    handleSubmit: () => void,
    toAmount: string,
    fromAmount: string,
    maxSlippage: number,
    costs: { [key: string]: number },
    ethPriceUsd: number,
    includeCostInBestRate: boolean,
    onIncludeTxCostChange: () => void,
    onMaxSlippageChange: (v: number) => void
}) => {
    const { isActive } = useWeb3React<Web3Provider>()
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const init = async () => {
            await ethereumReady(10000);
            setIsReady(true);
        }
        init()
    }, [])

    if (!fromToken?.symbol || !toToken?.symbol) {
        return <></>
    }

    const routeRadioOptions = routes.map((route) => {
        return {
            value: route.value,
            label: <SwapRoute
                includeCostInBestRate={includeCostInBestRate}
                cost={costs[route.value]}
                ethPriceUsd={ethPriceUsd}
                label={route.label}
                isBestRoute={bestRoute === route.value}
                image={route.image}
            />
        }
    })

    const isStabilizer = chosenRoute === Swappers.stabilizer;

    const slippageZone = isStabilizer ?
        <Flex alignItems="center" w="full">
            <SwapInfoMessage description="No slippage when using the Stabilizer" />
        </Flex>
        :
        <SwapSlippage onChange={(v: string) => onMaxSlippageChange(parseFloat(v))} toToken={toToken} toAmount={toAmount} maxSlippage={maxSlippage} />

    const exRate = exRates && exRates[chosenRoute] ? exRates[chosenRoute][fromToken?.symbol + toToken?.symbol]?.toFixed(4) || '' : '';

    return (
        <>
            <HStack color="secondaryTextColor" spacing="1" alignItems="center" h="28px" w='full' justify={{ base: 'center', sm: 'center' }} fontSize="12px">
                <AnimatedInfoTooltip
                    size="intermediary"
                    message="If enabled (Recommended): calculates the Best Route in total USD terms, meaning it includes the USD worth of the Eth Gas Fees needed for the transaction with the current gas price. Gas Fees are estimations only, check the real cost in your wallet." />
                <Text color="secondaryTextColor">
                    Best Rate Including Swap Gas Fees
                </Text>
                <Switch value="true" isChecked={includeCostInBestRate} onChange={onIncludeTxCostChange} />
            </HStack>
            <Flex alignItems="flex-start" flexDirection={{ base: 'column', sm: 'row' }} w='full' justifyContent="space-between">
                <VStack textAlign="left" w='full'>
                    <RadioCardGroup
                        wrapperProps={{ w: 'full', alignItems: 'center', justify: { base: 'center', sm: 'left' } }}
                        group={{
                            name: 'swapper',
                            value: chosenRoute,
                            onChange: onRouteChange,
                        }}
                        radioCardProps={{ py: 0, px: '2', mr: '4', w: { base: 'full', sm: '135px' } }}
                        options={routeRadioOptions}
                    />
                    <SwapText textAlign={{ base: 'center', sm: 'left' }}>
                        {
                            !isActive ? <>&nbsp;</> :
                                !exRate ?
                                    isStabilizer ? '' : 'Fetching rates...'
                                    :
                                    `Exchange Rate : 1 ${fromToken?.symbol} = ${exRate} ${toToken?.symbol}`
                        }
                    </SwapText>
                </VStack>
                <VStack mt={{ base: '1' }} alignItems="flex-start" w={{ base: 'full', sm: 'auto' }} spacing={2} height={{ base: 'auto', sm: '60px' }}>
                    {slippageZone}
                </VStack>
            </Flex>

            {
                chosenRoute === Swappers.stabilizer && !canUseStabilizer ?
                    <SwapInfoMessage status="warning" description="The Stabilizer can only be used for the DAI-DOLA pair" />
                    :
                    chosenRoute === Swappers.stabilizer && noStabilizerLiquidity && !notEnoughTokens ?
                        <SwapInfoMessage description="There is not enough DAI liquidity in the Stabilizer right now for this swap" />
                        :
                        chosenRoute === Swappers.crv && [fromToken?.symbol, toToken?.symbol].includes('FRAX') ?
                            <SwapInfoMessage status="warning" description="The 3POOL can only be used for DOLA, USDC, USDT and DAI" />
                            :
                            chosenRoute === Swappers.crvFrax && ([fromToken?.symbol, toToken?.symbol].includes('USDT') || [fromToken?.symbol, toToken?.symbol].includes('DAI')) ?
                                <SwapInfoMessage status="warning" description="The FraxPool can only be used for DOLA, FRAX and USDC" />
                                :
                                <>
                                    <RSubmitButton isDisabled={isDisabled} onClick={handleSubmit}>
                                        {
                                            notEnoughTokens ? 'Not enough tokens' : isApproved ? 'Swap' : 'Step 1/2 - Approve'
                                        }
                                        {
                                            !isApproved ?
                                                <AnimatedInfoTooltip iconProps={{ ml: '2' }} message="Approvals are required once per Token and Protocol" /> : null
                                        }
                                    </RSubmitButton>
                                </>
            }
        </>
    )
}