import { AmountInfos } from "@app/components/common/Messages/AmountInfos"
import { HStack, Text, TextProps } from "@chakra-ui/react"

export const PercentagesOfMax = ({
    isSmallerThan728 = false,
    onChange,
    max,
    usableMax,
}: {
    isSmallerThan728?: boolean,
    onChange?: (v: string) => void,
    max: number,
    usableMax?: number,
}) => {
    const quarterMax = Math.floor(0.25 * max);
    const halfMax = Math.floor(0.50 * max);
    const threeQuarterMax = Math.floor(0.75 * max);
    const _usableMax = usableMax || max;

    return <HStack w='full' justify="space-between">
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~25%`} format={false} value={quarterMax} textProps={{ fontSize: '14px', onClick: () => onChange(quarterMax.toFixed(0)) }} />
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~50%`} format={false} value={halfMax} textProps={{ fontSize: '14px', onClick: () => onChange(halfMax.toFixed(0)) }} />
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~75%`} format={false} value={threeQuarterMax} textProps={{ fontSize: '14px', onClick: () => onChange(threeQuarterMax.toFixed(0)) }} />
        <AmountInfos label={`${!isSmallerThan728 ? 'Borrow ' : ''}~99%`} format={false} value={_usableMax} textProps={{ fontSize: '14px', onClick: () => onChange(_usableMax.toFixed(0)) }} />
    </HStack>
}

const DEFAULT_TICKS = [0, 25, 50, 75, 100];

const handleWidth = 14;

export const PercentagesBar = ({
    onChange,
    ticks = DEFAULT_TICKS,
    tickProps,
    showAsRepartition = false,
}: {
    onChange: (v: string) => void,
    ticks?: number[],
    tickProps?: TextProps,
    showAsRepartition?: boolean,
}) => {
    return <HStack w='full' justify="space-between" spacing="0">
        {
            ticks.map(tick => {
                const isMiddle = tick !== 0 && tick !== 100;
                return <Text
                    key={tick}
                    w='94px'
                    position={isMiddle ? 'absolute' : 'relative'}
                    left={isMiddle ? `calc(${tick}% + ${handleWidth/2-tick/100*handleWidth}px)` : undefined}
                    transform={isMiddle ? `translateX(-${tick}%)` : undefined}
                    color="accentTextColor"
                    _hover={{ color: 'mainTextColor' }}
                    cursor="pointer"
                    fontSize='14px'
                    onClick={() => onChange(tick)}
                    {...tickProps}
                >
                    {showAsRepartition ? `${100 - tick}% | ${tick}%` : `${tick}%`}
                </Text>
            })
        }
    </HStack>
}