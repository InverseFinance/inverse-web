
import { useEffect, useState } from 'react'
import { Text, TextProps, VStack } from '@chakra-ui/react'
import { Web3Provider } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { Swappers, Token } from '@inverse/types';
import { SubmitButton } from '@inverse/components/common/Button'
import { RadioCardGroup } from '@inverse/components/common/Input/RadioCardGroup'
import { AnimatedInfoTooltip } from '@inverse/components/common/Tooltip'
import { InfoMessage } from '@inverse/components/common/Messages'
import { SwapSlippage } from './SwapSlippage'
import { ethereumReady } from '@inverse/util/web3';
import { SwapRoute } from './SwapRoute';

const SwapInfoMessage = ({ description, height }: { description: string, height?: string }) => {
    return <InfoMessage alertProps={{ w: 'full', fontSize: '12px', height }} description={description} />
}

const SwapText = ({ children, ...props }: { children: React.ReactNode } & Partial<TextProps>) => {
    return <Text color={'whiteAlpha.800'} textAlign="center" w="full" fontSize="12px" {...props}>
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
    onMaxSlippageChange: (v: number) => void
}) => {
    const { active } = useWeb3React<Web3Provider>()
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const init = async () => {
            await ethereumReady(10000);
            setIsReady(true);
        }
        init()
    }, [])

    const routeRadioOptions = routes.map((route) => {
        return {
            value: route.value,
            label: <SwapRoute label={route.label} isBestRoute={ bestRoute === route.value } />
        }
    })

    const slippageZone = chosenRoute === Swappers.stabilizer ?
        <SwapText lineHeight="28px">There is no slippage when using the Stabilizer</SwapText>
        :
        <SwapSlippage onChange={(v: string) => onMaxSlippageChange(parseFloat(v))} toToken={toToken} toAmount={toAmount} maxSlippage={maxSlippage} />

    const exRate = exRates && exRates[chosenRoute] ? exRates[chosenRoute][fromToken.symbol + toToken.symbol]?.toFixed(4) || '' : '';

    return (
        <>
            <RadioCardGroup
                wrapperProps={{ w: 'full', alignItems: 'center', justify: 'center' }}
                group={{
                    name: 'swapper',
                    value: chosenRoute,
                    onChange: onRouteChange,
                }}
                radioCardProps={{ p: 0, mx: '2' }}
                options={routeRadioOptions}
            />

            {
                chosenRoute === Swappers.stabilizer && !canUseStabilizer ?
                    <SwapInfoMessage description="The Stabilizer can only be used for the DAI-DOLA pair" />
                    :
                    chosenRoute === Swappers.stabilizer && noStabilizerLiquidity && !notEnoughTokens ?
                        <SwapInfoMessage description="There is not enough DAI liquidity in the Stabilizer right now for this swap" />
                        :
                        <>
                            <VStack spacing={2} height={{ base: 'auto', sm: '60px' }}>
                                <SwapText>
                                    {
                                        !active ? <>&nbsp;</> :
                                            !exRate ? 'Fetching rates...'
                                                :
                                                `Exchange Rate : 1 ${fromToken.symbol} = ${exRate} ${toToken.symbol}`
                                    }
                                </SwapText>
                                {slippageZone}
                            </VStack>

                            <SubmitButton isDisabled={isDisabled} onClick={handleSubmit}>
                                {
                                    notEnoughTokens ? 'Not enough tokens' : isApproved ? 'Swap' : 'Approve'
                                }
                                {
                                    !isApproved ?
                                        <AnimatedInfoTooltip iconProps={{ ml: '2' }} message="Approvals are required once per Token and Protocol" /> : null
                                }
                            </SubmitButton>
                        </>
            }
        </>
    )
}