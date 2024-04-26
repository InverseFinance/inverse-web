import { Flex, SlideFade, Stack, Text } from '@chakra-ui/react'

import { Prices } from '@app/types'
import { Fund, Funds } from '@app/components/Transparency/Funds'
import { useEffect, useState } from 'react'
import { ArrowLeftIcon } from '@chakra-ui/icons'
import { useDualSpeedEffect } from '@app/hooks/useDualSpeedEffect'
import { SkeletonBlob } from '../common/Skeleton'

export const FundsDetails = ({
    funds,
    title,
    prices,
    type = 'both',
    labelWithPercInChart = false,
    showAsAmountOnly = false,
    asStable = false,
    totalLabel,
    description = '',
    isLoading,
    useRecharts = false,
    chartMode = true,
    leftSideMaxW,
    chartProps,
    ...stackProps
}: {
    funds: Fund[],
    title: string,
    description: string,
    prices: Prices["prices"],
    type?: 'both' | 'balance' | 'allowance',
    labelWithPercInChart?: boolean,
    showAsAmountOnly?: boolean,
    asStable?: boolean,
    totalLabel?: string
    isLoading?: boolean
    useRecharts?: boolean
    chartMode?: boolean
    leftSideMaxW?: string
    chartProps?: any
}) => {
    const [data, setData] = useState(funds);
    const [isDrilled, setIsDrilled] = useState(false);
    const [isAfterSlideEffect, setIsAfterSlideEffect] = useState(false);
    const [subtitle, setSubtitle] = useState('');
    const [drilledDatum, setDrilledDatum] = useState(null);

    useEffect(() => {
        if(isDrilled) {
            handleDrill(drilledDatum);
        } else {
            setData(funds);
        }
    }, [funds, isDrilled, drilledDatum]);

    const handleDrill = (datum) => {
        if (datum?.fund?.drill) {
            setDrilledDatum(datum);
            setData(datum?.fund?.drill);
            setIsDrilled(true);
            setSubtitle(datum?.fund?.label || datum?.fund?.token?.symbol);
        }
    }

    const reset = () => {
        setIsDrilled(false);
    }

    useDualSpeedEffect(() => {
        setIsAfterSlideEffect(isDrilled);
    }, [isDrilled], isDrilled, 500, 500);

    return <Stack p={'1'} direction="column" minW={{ base: 'full', sm: '400px' }} {...stackProps}>
        <Stack>
            { !!title && <Text textAlign="center" color="accentTextColor" fontSize="20px" fontWeight="extrabold">{title}:</Text>}
            {
                !!description && <Text textAlign="center" color="mainTextColor" fontSize="14px" fontWeight="extrabold">{description}:</Text>
            }
            <Stack spacing="0" justify="center" alignItems="center" position="relative">
                {
                    isDrilled && <Flex cursor="pointer" onClick={reset} alignItems="center" color="secondary" fontSize="12px" position="absolute" left="0" top="0">
                        <ArrowLeftIcon fontSize="10px" color="secondary" />
                        <Text ml="1" color="secondary">Back</Text>
                    </Flex>
                }
                {
                    isDrilled && <Flex alignItems="center" color="secondary" fontSize="12px" position="absolute" right="0" top="0">
                        <Text color="secondary">{subtitle}</Text>
                    </Flex>
                }
                {
                    data?.length && !isLoading && chartMode && <Funds chartProps={chartProps} leftSideMaxW={leftSideMaxW} isLoading={isLoading} totalLabel={totalLabel} showAsAmountOnly={showAsAmountOnly} asStable={asStable} type={type} minUsd={1} handleDrill={isDrilled ? undefined : handleDrill} prices={prices} funds={data} chartMode={true} useRecharts={useRecharts} showTotal={true} labelWithPercInChart={labelWithPercInChart} />
                }
                {
                    isLoading && <SkeletonBlob />
                }
            </Stack>
        </Stack>

        <SlideFade in={!isDrilled} unmountOnExit={true}>
            <Stack fontSize="12px" spacing="2">
                <Funds leftSideMaxW={leftSideMaxW} isLoading={isLoading} totalLabel={totalLabel} showAsAmountOnly={showAsAmountOnly} asStable={asStable} type={type} minUsd={1} prices={prices} funds={funds} showPrice={false} showTotal={false} />
            </Stack>
        </SlideFade>
        {
            isAfterSlideEffect && <SlideFade in={isDrilled} unmountOnExit={true}>
                <Stack fontSize="12px" spacing="2">
                    <Funds leftSideMaxW={leftSideMaxW} isLoading={isLoading} totalLabel={totalLabel} showAsAmountOnly={showAsAmountOnly} asStable={asStable} type={type} minUsd={1} prices={prices} funds={data} showPrice={false} showTotal={false} />
                </Stack>
            </SlideFade>
        }
    </Stack >
}