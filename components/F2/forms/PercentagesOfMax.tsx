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
    leftLabel,
    rightLabel,
}: {
    onChange: (v: string) => void,
    ticks?: number[],
    tickProps?: TextProps,
    showAsRepartition?: boolean,
    leftLabel?: string,
    rightLabel?: string,
}) => {
    return <HStack w='full' justify="space-between" spacing="0">
        {
            ticks.map(tick => {
                const isIntermediate = tick !== 0 && tick !== 100 && tick !== 50;
                const hasCustomLeft = tick === 0 && !!leftLabel;
                const hasCustomRight = tick === 100 && !!rightLabel;
                return <Text
                    align={tick === 0 ? 'left' : tick == 100 ? 'right' : 'center'}
                    key={tick}
                    w={showAsRepartition || tick === 50 ? '94px' : (hasCustomLeft || hasCustomRight) ? '33%' : '60px'}
                    position={isIntermediate ? 'absolute' : 'relative'}
                    left={isIntermediate ? `calc(${tick}% + ${handleWidth / 2 - tick / 100 * handleWidth}px)` : undefined}
                    transform={isIntermediate ? `translateX(-${tick}%)` : undefined}
                    color="accentTextColor"
                    _hover={{ color: 'mainTextColor' }}
                    cursor="pointer"
                    fontSize='14px'
                    onClick={() => onChange(tick)}
                    {...tickProps}
                >
                    {
                        hasCustomRight ? rightLabel :
                            hasCustomLeft ? leftLabel :
                                showAsRepartition || tick === 50 ?
                                    `${100 - tick}% | ${tick}%`
                                    : `${tick}%`
                    }
                </Text>
            })
        }
    </HStack>
}