import { shortenNumber } from "@app/util/markets"
import { HStack, StackProps, Text, TextProps } from "@chakra-ui/react"

export const AmountInfos = ({
    label,
    value,
    delta,
    price,
    dbrCover,
    textProps,
    format = true,
    ...props
}: {
    label: string
    value: number
    delta?: number
    price?: number
    dbrCover?: number
    format?: boolean
    textProps?: Partial<TextProps>
} & Partial<StackProps>) => {
    const _textProps = { fontSize: '12px', color: 'secondaryTextColor', ...textProps }
    const formatFun = format ? shortenNumber : (v) => v;
    const deltaSign = (delta || 0) > 0 ? '+' : '-';
    const newValue = value + (delta || 0);

    const dbrText = dbrCover ? ` + DBR Cost = ${formatFun(dbrCover + newValue, 2)}` : ''
    const newValueUSD = price ? `(${formatFun(newValue * price, 2, true)})` : '';
    const deltaUSD = price && delta ? ` (${formatFun(delta * price, 2, true)})` : ''
    const formattedDelta = delta ? formatFun(Math.abs(delta), 2, false) : '';

    return <HStack spacing="1" justify="space-between" {...props}>
        <Text {..._textProps}>
            {label}: {!!value ?
                formatFun(value, 2, false) : ''} {price && !!value ? `(${formatFun(value * price, 2, true)})`
                    : delta || !!value ? '' : '0'
            }
        </Text>
        {
            (!!delta) &&
            <Text {..._textProps}>
                {
                    !!delta && !!value ?
                        `${deltaSign}${!!value ? ' ' : ''}${formattedDelta}${deltaUSD} => `
                        :
                        ''
                }
                {formatFun(newValue, 2, false)} {newValueUSD}{dbrText}</Text>
        }
    </HStack>
}