import { shortenNumber } from "@app/util/markets"
import { HStack, StackProps, Text, TextProps } from "@chakra-ui/react"

export const AmountInfos = ({
    label,
    value,
    newValue,
    price,
    dbrCover,
    textProps,
    format = true,
    ...props
}: {
    label: string
    value: number
    newValue?: number
    price?: number
    dbrCover?: number
    format?: boolean
    textProps?: Partial<TextProps>
} & Partial<StackProps>) => {
    const _textProps = { fontSize: '12px', color: 'secondaryTextColor', ...textProps }
    const formatFun = format ? shortenNumber : (v) => v;
    const deltaAmount = value && newValue ? newValue - value : 0;
    const deltaSign = deltaAmount > 0 ? '+' : '-';
    return <HStack spacing="1" justify="space-between" {...props}>
        <Text {..._textProps}>
            {label}: {!!value || !value && !newValue ? formatFun(value, 2, false, true) : ''} {price && value ? `(${formatFun(value * price, 2, true)})` : ''}
        </Text>
        {
            !!newValue && value !== newValue &&
            <Text {..._textProps}> {!!value && !!newValue ? `${deltaSign} ${formatFun(deltaAmount, 2, false, true)}${price ? ` (${formatFun(deltaAmount * price, 2, true)})` : ''} => ` : ''}{formatFun(newValue, 2, false, true)} {price ? `(${formatFun(newValue * price, 2, true)})` : ''}{dbrCover ? ` + DBR Debt = ${formatFun(dbrCover + newValue, 2)}` : ''}</Text>
        }
    </HStack>
}